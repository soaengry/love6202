import type { Gallery } from "@prisma/client";

export interface GalleryResponse {
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
    displayUrl: gallery.displayUrl,
    displayWebpUrl: gallery.displayWebpUrl,
    thumbnailUrl: gallery.thumbnailUrl,
    thumbnailWebpUrl: gallery.thumbnailWebpUrl,
    width: gallery.width,
    height: gallery.height,
    caption: gallery.caption,
    orderIndex: gallery.orderIndex,
    createdAt: gallery.createdAt.toISOString(),
  };
}
