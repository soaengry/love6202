export interface GalleryImage {
  id: number;
  weddingId: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface GalleryListResponse {
  items: GalleryImage[];
  totalCount: number;
  page: number;
  size: number;
  hasNext: boolean;
}
