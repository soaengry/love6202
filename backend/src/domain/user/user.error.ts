export const UserErrorCode = {
  USER_NOT_FOUND:              { code: "USER_NOT_FOUND",              status: 404, message: "사용자를 찾을 수 없습니다." },
  DUPLICATE_EMAIL:             { code: "DUPLICATE_EMAIL",             status: 409, message: "이미 사용 중인 이메일입니다." },
  DUPLICATE_NICKNAME:          { code: "DUPLICATE_NICKNAME",          status: 409, message: "이미 사용 중인 닉네임입니다." },
  CONCURRENT_UPDATE:           { code: "CONCURRENT_UPDATE",           status: 409, message: "동시 수정이 발생했습니다. 다시 시도해주세요." },
  ACCOUNT_PERMANENTLY_DELETED: { code: "ACCOUNT_PERMANENTLY_DELETED", status: 410, message: "영구 삭제된 계정입니다." },
  AUTH_INVALID_REFRESH_TOKEN:  { code: "AUTH_INVALID_REFRESH_TOKEN",  status: 401, message: "유효하지 않은 리프레시 토큰입니다." },
  AUTH_TOKEN_REVOKED:          { code: "AUTH_TOKEN_REVOKED",          status: 401, message: "토큰이 무효화되었습니다." },
  AUTH_GOOGLE_FAILED:          { code: "AUTH_GOOGLE_FAILED",          status: 401, message: "Google 인증에 실패했습니다." },
} as const;
