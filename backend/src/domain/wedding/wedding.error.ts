export const WeddingErrorCode = {
  WEDDING_NOT_FOUND: {
    code: "WEDDING_NOT_FOUND",
    status: 404,
    message: "초대장을 찾을 수 없습니다.",
  },
  WEDDING_UNAUTHORIZED: {
    code: "WEDDING_UNAUTHORIZED",
    status: 403,
    message: "초대장에 대한 권한이 없습니다.",
  },
  WEDDING_ALREADY_EXISTS: {
    code: "WEDDING_ALREADY_EXISTS",
    status: 409,
    message: "이미 초대장이 존재합니다.",
  },
  HERO_IMAGE_LIMIT_EXCEEDED: {
    code: "HERO_IMAGE_LIMIT_EXCEEDED",
    status: 400,
    message: "대표 이미지는 최대 4장까지 등록 가능합니다.",
  },
  COUPLE_ALREADY_EXISTS: {
    code: "COUPLE_ALREADY_EXISTS",
    status: 409,
    message: "해당 역할의 정보가 이미 등록되어 있습니다.",
  },
} as const;
