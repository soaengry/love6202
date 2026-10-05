export const UPLOAD_API = {
  BASE: "/uploads",
  ME: "/uploads/me",
  PRESIGN: "/uploads/presign",
  COMPLETE: "/uploads/complete",
} as const;

export const UPLOAD_VALIDATION = {
  MAX_UPLOAD_COUNT: 20,
  MAX_FILE_SIZE_MB: 10,
  ACCEPTED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  /** S3 직접 업로드 동시 전송 수 */
  PUT_CONCURRENCY: 3,
  /** 썸네일 생성 대기 중 목록 갱신 간격·최대 대기 시간 */
  PROCESSING_POLL_MS: 3_000,
  PROCESSING_POLL_MAX_MS: 120_000,
} as const;
