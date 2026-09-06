import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { errorHandler } from "@/middleware/errorHandler";
import { env } from "@/config/env";
import authRouter from "@/domain/user/auth.router";
import userRouter from "@/domain/user/user.router";
import weddingRouter from "@/domain/wedding/wedding.router";
import bankRouter from "@/domain/bank/bank.router";
import galleryRouter from "@/domain/gallery/gallery.router";
import guestbookRouter from "@/domain/guestbook/guestbook.router";
import uploadRouter from "@/domain/upload/upload.router";
import adminRouter from "@/domain/admin/admin.router";
import rsvpRouter from "@/domain/rsvp/rsvp.router";
import ogRouter from "@/domain/og/og.router";
import { ensureSession } from "@/middleware/session";
import { issueCsrfToken, verifyCsrf } from "@/middleware/csrf";

const app = express();

// nginx 프록시 뒤에서 실행되므로 X-Forwarded-For 신뢰
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  frameguard: { action: "deny" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  crossOriginEmbedderPolicy: false, // OAuth2 리다이렉트 허용
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(ensureSession);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: Math.floor(process.uptime()) });
});

// CSRF 토큰 발급 (프론트엔드가 상태 변경 요청 전 호출)
app.get("/api/auth/csrf", issueCsrfToken);


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: env.NODE_ENV === "production" ? 10 : 10_000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      status: { code: 429, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      data: null,
    });
  },
});

// auth 라우터는 OAuth2 코드 기반이므로 CSRF 불필요; 나머지는 CSRF 적용
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/users", verifyCsrf, userRouter);
app.use("/api/weddings", verifyCsrf, weddingRouter);
app.use("/api/banks", verifyCsrf, bankRouter);
app.use("/api/galleries", verifyCsrf, galleryRouter);
app.use("/api/guestbooks", verifyCsrf, guestbookRouter);
app.use("/api/uploads", verifyCsrf, uploadRouter);
app.use("/api/admin", verifyCsrf, adminRouter);
app.use("/api/rsvp", verifyCsrf, rsvpRouter);
app.use("/api/og", ogRouter);

app.use(errorHandler);

export default app;
