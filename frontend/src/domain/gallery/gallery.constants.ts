export const GALLERY_API = {
  BASE: "/galleries",
} as const;

export const GALLERY_VALIDATION = {
  MAX_UPLOAD_COUNT: 20,
  MAX_FILE_SIZE_MB: 2,
  ACCEPTED_TYPES: ["image/jpeg", "image/png"],
  PAGE_SIZE: 500,
} as const;
