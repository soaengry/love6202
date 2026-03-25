// ─── Enums ──────────────────────────────────────────────

export type CoupleRole = "GROOM" | "BRIDE";
export type AccountSide = "GROOM" | "GROOM_FAMILY" | "BRIDE" | "BRIDE_FAMILY";
export type TransportationType = "SUBWAY" | "BUS" | "SHUTTLE";

// ─── Response DTOs ──────────────────────────────────────

export interface WeddingResponse {
  id: number;
  title: string;
  weddingDate: string;
  venueName: string;
  venueAddress: string;
  venueDetail: string | null;
  venueLat: number | null;
  venueLng: number | null;
  dressCode: string | null;
  notice: string | null;
  parkingInfo: string | null;
  mealInfo: string | null;
  createdAt: string;
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
  bankName: string;
  bankCode: string;
  accountNumber: string;
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
  createdAt: string;
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

export interface BankResponse {
  id: number;
  bankCode: string;
  bankName: string;
}

// ─── Form Types ─────────────────────────────────────────

export interface CoupleFormData {
  role: CoupleRole;
  name: string;
  email: string;
  contact: string;
  fatherName: string;
  isFatherAlive: boolean;
  motherName: string;
  isMotherAlive: boolean;
}

export type PaymentMethod = "BANK" | "KAKAOPAY" | "TOSS";

export interface AccountFormData {
  side: AccountSide;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  kakaoPayUrl: string;
  tossNumber: string;
  orderIndex: number;
  paymentType: PaymentMethod;
}

export interface ScheduleFormData {
  title: string;
  description: string;
  orderIndex: number;
}

export interface TransportationFormData {
  type: TransportationType;
  title: string;
  description: string;
  orderIndex: number;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  isPinned: boolean;
}

export interface WeddingFormData {
  wedding: {
    title: string;
    weddingDate: string;
    venueName: string;
    venueAddress: string;
    venueDetail: string;
    venueLat: number | null;
    venueLng: number | null;
    dressCode: string;
    notice: string;
    parkingInfo: string;
    mealInfo: string;
  };
  couples: CoupleFormData[];
  accounts: AccountFormData[];
  schedules: ScheduleFormData[];
  transportations: TransportationFormData[];
  announcements: AnnouncementFormData[];
}
