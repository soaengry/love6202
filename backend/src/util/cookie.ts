import { Response } from "express";
import { env } from "@/config/env";

const isProduction = env.NODE_ENV === "production";

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

const commonOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("strict" as const) : ("lax" as const),
};

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    ...commonOptions,
    path: "/",
    maxAge: env.JWT_ACCESS_EXPIRATION,
  });
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    ...commonOptions,
    path: "/api/auth",
    maxAge: env.JWT_REFRESH_EXPIRATION,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
    ...commonOptions,
    path: "/",
  });
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    ...commonOptions,
    path: "/api/auth",
  });
}
