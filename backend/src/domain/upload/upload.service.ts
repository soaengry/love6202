import crypto from "crypto";
import prisma from "@/prisma";
import redis from "@/config/redis";
import { AppError } from "@/util/appError";
import {
  createPresignedPutUrl,
  headObject,
  deleteFileByKey,
  getExtension,
  getObjectUrl,
  getVariantKeys,
  IMMUTABLE_CACHE_CONTROL,
} from "@/service/s3.service";
import { deleteFromDrive } from "@/service/googleDrive.service";
import { driveSyncQueue, imageProcessQueue } from "@/config/queue";
import { UploadErrorCode } from "./upload.error";
import { MAX_UPLOAD_FILE_SIZE } from "./upload.schema";
import { toUploadResponse, type UploadResponse, type PresignedUpload } from "./upload.types";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const UPLOAD_FOLDER = "user-uploads";
const PRESIGN_EXPIRES_SEC = 10 * 60;
// presign 발급 정보 보관 — PUT URL 만료(10분) + 업로드 소요 여유
const PRESIGN_REDIS_TTL_SEC = 15 * 60;

const presignRedisKey = (s3Key: string) => `upload:presign:${s3Key}`;

const MIME_BY_EXT: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const mimeFromKey = (s3Key: string) => MIME_BY_EXT[s3Key.split(".").pop() ?? ""] ?? "image/jpeg";

// 업로더 식별 키 — 로그인 사용자는 u{userId}, 비로그인은 세션 ID 해시(세션 ID 원문은 삭제 권한 키라 노출 금지)
function getUploaderKey(sessionId: string, userId: number | undefined): string {
  if (userId) return `u${userId}`;
  return crypto.createHash("sha256").update(sessionId).digest("hex").slice(0, 8);
}

// Drive 파일명: {uploaderKey}-{YYYYMMDD-HHmmss(KST)}-{순번}.{ext} → 이름순 정렬 시 업로더별로 묶임
function buildDriveFileName(uploaderKey: string, uploadedAt: Date, index: number, mimetype: string): string {
  const [date, time] = new Date(uploadedAt.getTime() + KST_OFFSET_MS).toISOString().split("T");
  const timestamp = `${date.replace(/-/g, "")}-${time.slice(0, 8).replace(/:/g, "")}`;
  return `${uploaderKey}-${timestamp}-${String(index + 1).padStart(2, "0")}${getExtension(mimetype)}`;
}

// ─── List ───────────────────────────────────────────────

export async function getMyUploads(
  sessionId: string,
  userId: number | undefined,
  weddingId: number,
): Promise<UploadResponse[]> {
  const orConditions: { sessionId?: string; userId?: number }[] = [{ sessionId }];
  if (userId) orConditions.push({ userId });

  const uploads = await prisma.upload.findMany({
    where: { weddingId, OR: orConditions },
    orderBy: { createdAt: "desc" },
  });

  return uploads.map(toUploadResponse);
}

// ─── Upload (presigned URL) ─────────────────────────────

// 1단계: 브라우저가 S3에 직접 PUT 할 URL 발급
export async function createPresignedUploads(
  sessionId: string,
  weddingId: number,
  files: { contentType: string; size: number }[],
): Promise<PresignedUpload[]> {
  const wedding = await prisma.wedding.findUnique({ where: { id: weddingId }, select: { id: true } });
  if (!wedding) {
    throw AppError.from(UploadErrorCode.UPLOAD_WEDDING_NOT_FOUND);
  }

  return Promise.all(
    files.map(async ({ contentType, size }) => {
      const key = `${UPLOAD_FOLDER}/${crypto.randomUUID()}${getExtension(contentType)}`;
      const uploadUrl = await createPresignedPutUrl(key, contentType, size, PRESIGN_EXPIRES_SEC);
      await redis.setex(presignRedisKey(key), PRESIGN_REDIS_TTL_SEC, JSON.stringify({ sessionId, weddingId }));
      // 서명에 포함된 헤더 — 브라우저가 PUT 시 그대로 전송해야 함
      return { key, uploadUrl, headers: { "Content-Type": contentType, "Cache-Control": IMMUTABLE_CACHE_CONTROL } };
    }),
  );
}

// 2단계: S3 업로드 완료된 키 등록 → 썸네일 생성은 image-process 큐에서 비동기 처리
export async function completeUploads(
  sessionId: string,
  userId: number | undefined,
  weddingId: number,
  keys: string[],
): Promise<UploadResponse[]> {
  // 이 세션·웨딩으로 발급된 키인지 검증 (타인 키·임의 키 등록 방지)
  const issued = await redis.mget(...keys.map(presignRedisKey));
  const allIssued = issued.every((raw) => {
    if (!raw) return false;
    const info = JSON.parse(raw) as { sessionId: string; weddingId: number };
    return info.sessionId === sessionId && info.weddingId === weddingId;
  });
  if (!allIssued) {
    throw AppError.from(UploadErrorCode.UPLOAD_INVALID_KEY);
  }

  const heads = await Promise.all(keys.map(headObject));
  if (heads.some((head) => !head || head.size > MAX_UPLOAD_FILE_SIZE)) {
    throw AppError.from(UploadErrorCode.UPLOAD_FILE_NOT_FOUND);
  }

  // 발급 정보 소진 — 동시에 같은 키로 complete 하면 한쪽만 통과
  const deleted = await redis.del(...keys.map(presignRedisKey));
  if (deleted !== keys.length) {
    throw AppError.from(UploadErrorCode.UPLOAD_INVALID_KEY);
  }

  const uploads = await prisma.$transaction(
    keys.map((s3Key) =>
      prisma.upload.create({
        data: { weddingId, sessionId, userId: userId ?? null, imageUrl: getObjectUrl(s3Key), thumbnailUrl: null, s3Key },
      }),
    ),
  );

  // 썸네일 생성 잡 큐잉 (uploadId를 jobId로 사용해 삭제 시 취소 가능). 성공 시 워커가 Drive 동기화를 이어서 큐잉
  const uploaderKey = getUploaderKey(sessionId, userId);
  const uploadedAt = new Date();
  await Promise.all(
    uploads.map((upload, i) => {
      const mimeType = mimeFromKey(keys[i]);
      return imageProcessQueue
        .add(
          "process",
          {
            uploadId: upload.id,
            s3Key: keys[i],
            mimeType,
            weddingId,
            driveFileName: buildDriveFileName(uploaderKey, uploadedAt, i, mimeType),
          },
          { jobId: `upload-${upload.id}` },
        )
        .catch((err) => console.warn("[ImageProcess] Failed to enqueue job:", err.message));
    }),
  );

  return uploads.map(toUploadResponse);
}

// ─── Delete ─────────────────────────────────────────────

export async function deleteUpload(
  sessionId: string,
  userId: number | undefined,
  userRole: string | undefined,
  id: number,
): Promise<void> {
  const upload = await prisma.upload.findUnique({ where: { id } });
  if (!upload) {
    throw AppError.from(UploadErrorCode.UPLOAD_NOT_FOUND);
  }

  const isOwner =
    upload.sessionId === sessionId ||
    (userId != null && upload.userId === userId);
  const isPrivileged = userRole === "ADMIN" || userRole === "HOST";

  if (!isOwner && !isPrivileged) {
    throw AppError.from(UploadErrorCode.UPLOAD_UNAUTHORIZED);
  }

  // S3 원본 + display·썸네일(JPEG/WebP) 삭제
  if (upload.s3Key) {
    await Promise.all(
      [upload.s3Key, ...getVariantKeys(upload.s3Key)].map((key) => deleteFileByKey(key).catch(() => {})),
    );
  }

  if (upload.driveFileId) {
    // Drive 동기화 완료 → Drive에서도 삭제
    await deleteFromDrive(upload.driveFileId).catch(() => {});
  } else {
    // 썸네일 생성·Drive 동기화 대기 중 → 큐에서 잡 취소
    await Promise.all(
      [imageProcessQueue, driveSyncQueue].map(async (queue) => {
        const job = await queue.getJob(`upload-${id}`).catch(() => null);
        await job?.remove().catch(() => {});
      }),
    );
  }

  await prisma.upload.delete({ where: { id } });
}
