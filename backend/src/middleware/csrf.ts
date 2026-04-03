import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

// GET /api/auth/csrf — 클라이언트가 토큰을 요청하는 엔드포인트
export function issueCsrfToken(req: Request, res: Response): void {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // JS에서 읽어야 하므로 false
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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
