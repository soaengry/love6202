import type { AccountSide, PaymentMethod, TransportationType } from "./types.ts";

// ─── UI 옵션 상수 ────────────────────────────────────────

export const COUPLE_SECTIONS = [
  { index: 0, role: "GROOM" as const, label: "신랑", imageLabel: "신랑 사진" },
  { index: 1, role: "BRIDE" as const, label: "신부", imageLabel: "신부 사진" },
] as const;

export const SIDE_OPTIONS: { value: AccountSide; label: string }[] = [
  { value: "GROOM", label: "신랑측" },
  { value: "GROOM_FAMILY", label: "신랑 혼주측" },
  { value: "BRIDE", label: "신부측" },
  { value: "BRIDE_FAMILY", label: "신부 혼주측" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "BANK", label: "은행 계좌", icon: "🏦" },
  { value: "KAKAOPAY", label: "카카오페이", icon: "💛" },
  { value: "TOSS", label: "토스", icon: "💙" },
];

export const TRANSPORT_OPTIONS: { value: TransportationType; label: string }[] = [
  { value: "SUBWAY", label: "지하철" },
  { value: "BUS", label: "버스" },
  { value: "SHUTTLE", label: "셔틀" },
];

// ─── API 엔드포인트 ──────────────────────────────────────

export const WEDDING_API = {
  BASE: "/weddings",
  ME: "/weddings/me",
  LATEST: "/weddings/latest",
  DETAIL: (id: number) => `/weddings/${id}`,
} as const;

export const BANK_API = {
  LIST: "/banks",
  DETECT: "/banks/detect",
} as const;

export const WEDDING_VALIDATION = {
  TITLE_MAX_LENGTH: 255,
  VENUE_NAME_MAX_LENGTH: 255,
  VENUE_ADDRESS_MAX_LENGTH: 500,
  VENUE_DETAIL_MAX_LENGTH: 500,
  COUPLE_NAME_MAX_LENGTH: 50,
  CONTACT_MAX_LENGTH: 50,
} as const;
