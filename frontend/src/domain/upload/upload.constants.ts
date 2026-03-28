export const UPLOAD_API = {
  BASE: "/uploads",
  ME: "/uploads/me",
} as const;

export const UPLOAD_VALIDATION = {
  MAX_UPLOAD_COUNT: 10,
  MAX_FILE_SIZE_MB: 2,
  ACCEPTED_TYPES: ["image/jpeg", "image/png"],
} as const;
