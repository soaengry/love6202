import crypto from "crypto";
import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import { uploadImageWithThumbnail, deleteFileByKey, getExtension } from "@/service/s3.service";
import { deleteFromDrive } from "@/service/googleDrive.service";
import { driveSyncQueue } from "@/config/queue";
import { MAX_USER_UPLOAD_COUNT } from "@/middleware/upload";
import { UploadErrorCode } from "./upload.error";
import { toUploadResponse, type UploadResponse } from "./upload.types";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

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

// ─── Upload ─────────────────────────────────────────────

export async function uploadImages(
  sessionId: string,
  userId: number | undefined,
  weddingId: number,
  files: Express.Multer.File[],
): Promise<UploadResponse[]> {
  if (files.length > MAX_USER_UPLOAD_COUNT) {
    throw AppError.from(UploadErrorCode.UPLOAD_LIMIT_EXCEEDED);
  }

  const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
  if (!wedding) {
    throw AppError.from(UploadErrorCode.UPLOAD_WEDDING_NOT_FOUND);
  }

  // S3에 원본 + 썸네일 업로드 (병렬)
  const s3Results = await Promise.all(
    files.map(async (file) => {
      const { imageUrl, thumbnailUrl, originalKey } = await uploadImageWithThumbnail(file, "user-uploads");
      return { imageUrl, thumbnailUrl, s3Key: originalKey, originalname: file.originalname, mimetype: file.mimetype };
    }),
  );

  // DB 저장
  const uploads = await prisma.$transaction(
    s3Results.map(({ imageUrl, thumbnailUrl, s3Key }) =>
      prisma.upload.create({
        data: { weddingId, sessionId, userId: userId ?? null, imageUrl, thumbnailUrl, s3Key },
      }),
    ),
  );

  // Drive 동기화 잡 큐잉 (uploadId를 jobId로 사용해 삭제 시 취소 가능)
  const uploaderKey = getUploaderKey(sessionId, userId);
  const uploadedAt = new Date();
  await Promise.all(
    uploads.map((upload, i) =>
      driveSyncQueue
        .add(
          "sync",
          {
            uploadId: upload.id,
            s3Key: s3Results[i].s3Key,
            originalName: s3Results[i].originalname,
            fileName: buildDriveFileName(uploaderKey, uploadedAt, i, s3Results[i].mimetype),
            mimeType: s3Results[i].mimetype,
            weddingId,
          },
          { jobId: `upload-${upload.id}` },
        )
        .catch((err) => console.warn("[DriveSync] Failed to enqueue job:", err.message)),
    ),
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

  // S3 원본 + display + 썸네일 삭제
  const deletePromises: Promise<void>[] = [];
  if (upload.s3Key) {
    deletePromises.push(deleteFileByKey(upload.s3Key).catch(() => {}));
    // display 버전: {folder}/display/{uuid}.jpg
    const parts = upload.s3Key.split("/");
    const folder = parts.slice(0, -1).join("/");
    const uuid = parts[parts.length - 1].replace(/\.[^.]+$/, "");
    deletePromises.push(deleteFileByKey(`${folder}/display/${uuid}.jpg`).catch(() => {}));
  }
  if (upload.thumbnailUrl) {
    const thumbKey = new URL(upload.thumbnailUrl).pathname.slice(1);
    deletePromises.push(deleteFileByKey(thumbKey).catch(() => {}));
  }
  await Promise.all(deletePromises);

  if (upload.driveFileId) {
    // Drive 동기화 완료 → Drive에서도 삭제
    await deleteFromDrive(upload.driveFileId).catch(() => {});
  } else {
    // Drive 동기화 대기 중 → 큐에서 잡 취소
    const job = await driveSyncQueue.getJob(`upload-${id}`).catch(() => null);
    await job?.remove().catch(() => {});
  }

  await prisma.upload.delete({ where: { id } });
}
