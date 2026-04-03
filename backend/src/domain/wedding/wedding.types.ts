import type {
  Wedding, HeroImage, Couple, Account, Schedule,
  Transportation, Announcement, CoupleRole, AccountSide, TransportationType,
} from "@prisma/client";

// ─── Response DTOs ──────────────────────────────────────

export interface WeddingResponse {
  id: number;
  title: string;
  weddingDate: Date;
  venueName: string;
  venueAddress: string;
  venueDetail: string | null;
  venueLat: number | null;
  venueLng: number | null;
  dressCode: string | null;
  notice: string | null;
  parkingInfo: string | null;
  mealInfo: string | null;
  greeting: string | null;
  createdAt: Date;
}

export interface HeroImageResponse {
  id: number;
  imageUrl: string;
  thumbnailUrl: string | null;
  orderIndex: number;
}

export interface CoupleResponse {
  id: number;
  role: CoupleRole;
  name: string;
  email: string | null;
  contact: string | null;
  fatherName: string | null;
  isFatherAlive: boolean;
  motherName: string | null;
  isMotherAlive: boolean;
  profileImageUrl: string | null;
}

export interface AccountResponse {
  id: number;
  side: AccountSide;
  bankName: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountHolder: string;
  kakaoPayUrl: string | null;
  tossNumber: string | null;
  orderIndex: number;
}

export interface ScheduleResponse {
  id: number;
  title: string;
  description: string | null;
  orderIndex: number;
}

export interface TransportationResponse {
  id: number;
  type: TransportationType;
  title: string;
  description: string | null;
  orderIndex: number;
}

export interface AnnouncementResponse {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
}

export interface WeddingDetailResponse {
  wedding: WeddingResponse;
  heroImages: HeroImageResponse[];
  couples: CoupleResponse[];
  accounts: AccountResponse[];
  schedules: ScheduleResponse[];
  transportations: TransportationResponse[];
  announcements: AnnouncementResponse[];
}

// ─── Transformer ────────────────────────────────────────

type WeddingWithRelations = Wedding & {
  heroImages: HeroImage[];
  couples: Couple[];
  accounts: Account[];
  schedules: Schedule[];
  transportations: Transportation[];
  announcements: Announcement[];
};

export function toWeddingDetailResponse(w: WeddingWithRelations): WeddingDetailResponse {
  return {
    wedding: {
      id: w.id,
      title: w.title,
      weddingDate: w.weddingDate,
      venueName: w.venueName,
      venueAddress: w.venueAddress,
      venueDetail: w.venueDetail,
      venueLat: w.venueLat,
      venueLng: w.venueLng,
      dressCode: w.dressCode,
      notice: w.notice,
      parkingInfo: w.parkingInfo,
      mealInfo: w.mealInfo,
      greeting: w.greeting,
      createdAt: w.createdAt,
    },
    heroImages: w.heroImages
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((h) => ({
        id: h.id,
        imageUrl: h.imageUrl,
        thumbnailUrl: h.thumbnailUrl,
        orderIndex: h.orderIndex,
      })),
    couples: w.couples.map((c) => ({
      id: c.id,
      role: c.role,
      name: c.name,
      email: c.email,
      contact: c.contact,
      fatherName: c.fatherName,
      isFatherAlive: c.isFatherAlive,
      motherName: c.motherName,
      isMotherAlive: c.isMotherAlive,
      profileImageUrl: c.profileImageUrl,
    })),
    accounts: w.accounts
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((a) => ({
        id: a.id,
        side: a.side,
        bankName: a.bankName,
        bankCode: a.bankCode,
        accountNumber: a.accountNumber,
        accountHolder: a.accountHolder,
        kakaoPayUrl: a.kakaoPayUrl,
        tossNumber: a.tossNumber,
        orderIndex: a.orderIndex,
      })),
    schedules: w.schedules
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        orderIndex: s.orderIndex,
      })),
    transportations: w.transportations
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((t) => ({
        id: t.id,
        type: t.type,
        title: t.title,
        description: t.description,
        orderIndex: t.orderIndex,
      })),
    announcements: w.announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      isPinned: a.isPinned,
      createdAt: a.createdAt,
    })),
  };
}
