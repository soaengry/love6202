export const RsvpErrorCode = {
  RSVP_NOT_FOUND: {
    code: "RSVP_NOT_FOUND",
    status: 404,
    message: "참석 의향서를 찾을 수 없습니다.",
  },
  RSVP_UNAUTHORIZED: {
    code: "RSVP_UNAUTHORIZED",
    status: 403,
    message: "참석 의향서에 대한 권한이 없습니다.",
  },
  RSVP_WEDDING_NOT_FOUND: {
    code: "RSVP_WEDDING_NOT_FOUND",
    status: 404,
    message: "청첩장을 찾을 수 없습니다.",
  },
  RSVP_ALREADY_EXISTS: {
    code: "RSVP_ALREADY_EXISTS",
    status: 409,
    message: "이미 참석 의향서를 제출하셨습니다.",
  },
} as const;
