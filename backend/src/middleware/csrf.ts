import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "@/config/env";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

const isProduction = env.NODE_ENV === "production";

// GET /api/auth/csrf — 클라이언트가 토큰을 요청하는 엔드포인트
export function issueCsrfToken(req: Request, res: Response): void {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // JS에서 읽어야 하므로 false
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    // 프론트(love6202.soaengry.com)와 API(love6202.api.soaengry.com)가 다른
    // 서브도메인이므로 COOKIE_DOMAIN=.soaengry.com 으로 JS가 읽을 수 있게 함
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
    maxAge: 60 * 60 * 1000, // 1h
  });
  res.json({ status: { code: 200, message: "OK" }, data: { csrfToken: token } });
}

// 상태 변경 요청(POST/PUT/PATCH/DELETE)에 CSRF 검증
export function verifyCsrf(req: Request, res: Response, next: NextFunction): void {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({
      status: { code: 403, message: "CSRF token mismatch" },
      data: null,
    });
    return;
  }

  next();
}
