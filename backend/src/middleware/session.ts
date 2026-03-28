import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "@/config/env";
import { COOKIE_NAMES } from "@/util/cookie";

const isProduction = env.NODE_ENV === "production";

export function ensureSession(req: Request, res: Response, next: NextFunction) {
  let sessionId = req.cookies?.[COOKIE_NAMES.SESSION_ID];

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie(COOKIE_NAMES.SESSION_ID, sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1년
    });
  }

  req.sessionId = sessionId;
  next();
}
