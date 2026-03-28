import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import {
  getOrCreateWeddingFolder,
  uploadToDrive,
  deleteFromDrive,
} from "@/service/googleDrive.service";
import { UploadErrorCode } from "./upload.error";
import { toUploadResponse, type UploadResponse } from "./upload.types";

// ─── List (내 업로드 조회) ──────────────────────────────

export async function getMyUploads(
  sessionId: string,
  userId: number | undefined,
  weddingId: number,
): Promise<UploadResponse[]> {
  const orConditions: { sessionId?: string; userId?: number }[] = [
    { sessionId },
  ];
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
  if (files.length > 10) {
    throw AppError.from(UploadErrorCode.UPLOAD_LIMIT_EXCEEDED);
  }

  const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
  if (!wedding) {
    throw AppError.from(UploadErrorCode.UPLOAD_WEDDING_NOT_FOUND);
  }

  // Google Drive 폴더 확보
  const folderId = await getOrCreateWeddingFolder(weddingId);

  // Google Drive 업로드
  const uploadResults = await Promise.all(
    files.map((file) => uploadToDrive(file, folderId)),
  );

  // DB 저장
  const uploads = await prisma.$transaction(
    uploadResults.map(({ driveFileId, imageUrl }) =>
      prisma.upload.create({
        data: {
          weddingId,
          sessionId,
          userId: userId ?? null,
          driveFileId,
          imageUrl,
        },
      }),
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

  // 소유자 검증: sessionId 일치 OR userId 일치 OR ADMIN/HOST
  const isOwner =
    upload.sessionId === sessionId ||
    (userId != null && upload.userId === userId);
  const isPrivileged = userRole === "ADMIN" || userRole === "HOST";

  if (!isOwner && !isPrivileged) {
    throw AppError.from(UploadErrorCode.UPLOAD_UNAUTHORIZED);
  }

  // Google Drive 삭제
  await deleteFromDrive(upload.driveFileId).catch(() => {});

  // DB 삭제
  await prisma.upload.delete({ where: { id } });
}
