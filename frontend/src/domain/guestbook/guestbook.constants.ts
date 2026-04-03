export const GUESTBOOK_API = {
  BASE: "/guestbooks",
  SUBSCRIBE: "/guestbooks/subscribe",
} as const;

export const GUESTBOOK_VALIDATION = {
  MAX_CONTENT_LENGTH: 200,
  MAX_NAME_LENGTH: 50,
  PAGE_SIZE: 10,
} as const;

export const GUESTBOOK_TYPES = [
  "post_01", "post_02", "post_03", "post_04", "post_05",
  "post_06", "post_07", "post_08", "post_09", "post_10",
] as const;

export const GUESTBOOK_BG_BASE_URL = import.meta.env.VITE_S3_BASE_URL
  ? `${import.meta.env.VITE_S3_BASE_URL}/guestbooks`
  : "/guestbooks";
