import type { Guestbook } from "@prisma/client";

export interface GuestbookResponse {
  id: number;
  weddingId: number;
  name: string;
  content: string;
  type: string;
  rotation: number;
  createdAt: string;
}

export interface GuestbookListResponse {
  items: GuestbookResponse[];
  totalCount: number;
  page: number;
  size: number;
  hasNext: boolean;
}

export function toGuestbookResponse(guestbook: Guestbook): GuestbookResponse {
  return {
    id: guestbook.id,
    weddingId: guestbook.weddingId,
    name: guestbook.name,
    content: guestbook.content,
    type: guestbook.type,
    rotation: guestbook.rotation,
    createdAt: guestbook.createdAt.toISOString(),
  };
}
