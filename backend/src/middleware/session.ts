import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "@/config/env";
import { COOKIE_NAMES } from "@/util/cookie";

const isProduction = env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
  path: "/",
  maxAge: 365 * 24 * 60 * 60 * 1000, // 1년
};

export function ensureSession(req: Request, res: Response, next: NextFunction) {
  let sessionId = req.cookies?.[COOKIE_NAMES.SESSION_ID];

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie(COOKIE_NAMES.SESSION_ID, sessionId, COOKIE_OPTIONS);
  }

  req.sessionId = sessionId;
  next();
}

// 인증 이벤트(로그인, 토큰 갱신) 시 세션 ID를 교체하여 Session Fixation 방지
export function rotateSession(req: Request, res: Response): void {
  const newSessionId = crypto.randomUUID();
  res.cookie(COOKIE_NAMES.SESSION_ID, newSessionId, COOKIE_OPTIONS);
  req.sessionId = newSessionId;
}
