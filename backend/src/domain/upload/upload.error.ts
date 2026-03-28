export const UploadErrorCode = {
  UPLOAD_NOT_FOUND: {
    code: "UPLOAD_NOT_FOUND",
    status: 404,
    message: "업로드된 사진을 찾을 수 없습니다.",
  },
  UPLOAD_UNAUTHORIZED: {
    code: "UPLOAD_UNAUTHORIZED",
    status: 403,
    message: "이 사진을 삭제할 권한이 없습니다.",
  },
  UPLOAD_LIMIT_EXCEEDED: {
    code: "UPLOAD_LIMIT_EXCEEDED",
    status: 400,
    message: "한 번에 최대 10장까지 업로드할 수 있습니다.",
  },
  UPLOAD_WEDDING_NOT_FOUND: {
    code: "UPLOAD_WEDDING_NOT_FOUND",
    status: 404,
    message: "초대장을 찾을 수 없습니다.",
  },
  UPLOAD_SESSION_REQUIRED: {
    code: "UPLOAD_SESSION_REQUIRED",
    status: 400,
    message: "세션 정보가 필요합니다.",
  },
} as const;
