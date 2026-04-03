export const GalleryErrorCode = {
  GALLERY_NOT_FOUND: {
    code: "GALLERY_NOT_FOUND",
    status: 404,
    message: "갤러리 이미지를 찾을 수 없습니다.",
  },
  GALLERY_UNAUTHORIZED: {
    code: "GALLERY_UNAUTHORIZED",
    status: 403,
    message: "갤러리에 대한 권한이 없습니다.",
  },
  GALLERY_UPLOAD_LIMIT_EXCEEDED: {
    code: "GALLERY_UPLOAD_LIMIT_EXCEEDED",
    status: 400,
    message: "한 번에 최대 20장까지 업로드할 수 있습니다.",
  },
  GALLERY_WEDDING_NOT_FOUND: {
    code: "GALLERY_WEDDING_NOT_FOUND",
    status: 404,
    message: "초대장을 찾을 수 없습니다.",
  },
} as const;
