export const AdminErrorCode = {
  ADMIN_USER_NOT_FOUND: {
    code: "ADMIN_USER_NOT_FOUND",
    status: 404,
    message: "사용자를 찾을 수 없습니다.",
  },
  ADMIN_CANNOT_CHANGE_OWN_ROLE: {
    code: "ADMIN_CANNOT_CHANGE_OWN_ROLE",
    status: 400,
    message: "자신의 권한은 변경할 수 없습니다.",
  },
} as const;
