import type { Gallery } from "@prisma/client";

export interface GalleryResponse {
  id: number;
  weddingId: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface GalleryListResponse {
  items: GalleryResponse[];
  totalCount: number;
  page: number;
  size: number;
  hasNext: boolean;
}

export function toGalleryResponse(gallery: Gallery): GalleryResponse {
  return {
    id: gallery.id,
    weddingId: gallery.weddingId,
    imageUrl: gallery.imageUrl,
    thumbnailUrl: gallery.thumbnailUrl,
    caption: gallery.caption,
    orderIndex: gallery.orderIndex,
    createdAt: gallery.createdAt.toISOString(),
  };
}
