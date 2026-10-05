export interface UploadImage {
  id: number;
  weddingId: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  driveSynced: boolean;
  createdAt: string;
}

export interface PresignFileRequest {
  contentType: string;
  size: number;
}

export interface PresignedUpload {
  key: string;
  uploadUrl: string;
  /** 서명에 포함된 헤더 — S3 PUT 시 그대로 전송 */
  headers: Record<string, string>;
}
