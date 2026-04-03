import type { Upload } from "@prisma/client";

export interface UploadResponse {
  id: number;
  weddingId: number;
  imageUrl: string;
  createdAt: string;
}

export function toUploadResponse(upload: Upload): UploadResponse {
  return {
    id: upload.id,
    weddingId: upload.weddingId,
    imageUrl: `/api/uploads/image/${upload.driveFileId}`,
    createdAt: upload.createdAt.toISOString(),
  };
}
