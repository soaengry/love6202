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
