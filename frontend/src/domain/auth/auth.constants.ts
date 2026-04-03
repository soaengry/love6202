export const TOKEN_KEY = {
  DEVICE_ID: "love_device_id",
} as const;

export const AUTH_API = {
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  CHECK_NICKNAME: "/auth/check-nickname",
};

export const USER_API = {
  ME: "/users/me",
};

export const AUTH_VALIDATION = {
  NICKNAME_MIN_LENGTH: 2,
  NICKNAME_MAX_LENGTH: 50,
} as const;
