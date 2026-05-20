export interface AdminWeddingListItem {
  id: number;
  title: string;
  weddingDate: string;
  venueName: string;
  coupleNames: string;
  isPinned: boolean;
  createdAt: string;
}

export type UserRole = "GUEST" | "HOST" | "ADMIN";

export interface AdminUserSearchResult {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  profileImageUrl: string | null;
  createdAt: string;
}
