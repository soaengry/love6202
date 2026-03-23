import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/util/jwt";
import { apiResponse } from "@/util/apiResponse";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json(apiResponse.error(401, "UNAUTHORIZED"));
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);

    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json(apiResponse.error(401, "INVALID_TOKEN"));
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.userRole !== "ADMIN") {
    return res.status(403).json(apiResponse.error(403, "FORBIDDEN"));
  }
  next();
}

// 인증 선택적
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = verifyToken(header.slice(7));
      req.userId = payload.userId;
      req.userRole = payload.role;
    } catch {
      /* 무시 — 비로그인 사용자 허용 */
    }
  }
  next();
}
