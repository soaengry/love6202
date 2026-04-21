export interface UploadImage {
  id: number;
  weddingId: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  driveSynced: boolean;
  createdAt: string;
}
