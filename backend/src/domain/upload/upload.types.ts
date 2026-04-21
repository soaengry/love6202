import type { Upload } from "@prisma/client";

export interface UploadResponse {
  id: number;
  weddingId: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  driveSynced: boolean;
  createdAt: string;
}

export function toUploadResponse(upload: Upload): UploadResponse {
  return {
    id: upload.id,
    weddingId: upload.weddingId,
    imageUrl: upload.imageUrl,
    thumbnailUrl: upload.thumbnailUrl,
    driveSynced: upload.driveFileId != null,
    createdAt: upload.createdAt.toISOString(),
  };
}
