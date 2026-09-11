export interface GalleryImage {
  id: number;
  weddingId: number;
  imageUrl: string;
  displayUrl: string | null;
  displayWebpUrl: string | null;
  thumbnailUrl: string | null;
  thumbnailWebpUrl: string | null;
  width: number | null;
  height: number | null;
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
