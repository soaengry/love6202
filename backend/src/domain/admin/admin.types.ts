import type { Wedding, Couple, User, Role } from "@prisma/client";

// ─── Response DTOs ──────────────────────────────────────

export interface AdminWeddingListItem {
  id: number;
  title: string;
  weddingDate: Date;
  venueName: string;
  coupleNames: string;
  createdAt: Date;
}

export interface AdminUserSearchResult {
  id: number;
  email: string;
  nickname: string;
  role: Role;
  profileImageUrl: string | null;
  createdAt: Date;
}

// ─── Transformers ───────────────────────────────────────

type WeddingWithCouples = Wedding & { couples: Couple[] };

export function toAdminWeddingListItem(w: WeddingWithCouples): AdminWeddingListItem {
  const coupleNames = w.couples
    .sort((a, b) => (a.role === "GROOM" ? -1 : 1))
    .map((c) => c.name)
    .join(" & ");

  return {
    id: w.id,
    title: w.title,
    weddingDate: w.weddingDate,
    venueName: w.venueName,
    coupleNames,
    createdAt: w.createdAt,
  };
}

export function toAdminUserSearchResult(u: User): AdminUserSearchResult {
  return {
    id: u.id,
    email: u.email,
    nickname: u.nickname,
    role: u.role,
    profileImageUrl: u.profileImageUrl,
    createdAt: u.createdAt,
  };
}
