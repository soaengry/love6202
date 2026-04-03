export interface GuestbookEntry {
  id: number;
  weddingId: number;
  name: string;
  content: string;
  type: string;
  rotation: number;
  createdAt: string;
}

export interface GuestbookListResponse {
  items: GuestbookEntry[];
  totalCount: number;
  page: number;
  size: number;
  hasNext: boolean;
}

export interface GuestbookCreateRequest {
  weddingId: number;
  name: string;
  content: string;
  type: string;
}
