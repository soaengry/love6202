export const GuestbookErrorCode = {
  GUESTBOOK_NOT_FOUND: {
    code: "GUESTBOOK_NOT_FOUND",
    status: 404,
    message: "방명록을 찾을 수 없습니다.",
  },
  GUESTBOOK_UNAUTHORIZED: {
    code: "GUESTBOOK_UNAUTHORIZED",
    status: 403,
    message: "방명록에 대한 권한이 없습니다.",
  },
  GUESTBOOK_WEDDING_NOT_FOUND: {
    code: "GUESTBOOK_WEDDING_NOT_FOUND",
    status: 404,
    message: "초대장을 찾을 수 없습니다.",
  },
} as const;
