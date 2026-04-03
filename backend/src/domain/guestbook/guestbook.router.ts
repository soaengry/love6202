import { Router, Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { authenticate, requireAdminOrHost } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { apiResponse } from "@/util/apiResponse";
import { env } from "@/config/env";
import { guestbookQuerySchema, guestbookCreateSchema, guestbookDeleteParamsSchema } from "./guestbook.schema";
import * as guestbookService from "./guestbook.service";

const router = Router();

// ─── Public ──────────────────────────────────────────────

// GET /api/guestbooks?weddingId=1&page=0&size=10 — 방명록 목록 조회
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, page, size } = guestbookQuerySchema.parse(req.query);
      const result = await guestbookService.getGuestbooks(weddingId, page, size);
      res.json(apiResponse.ok("방명록 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/guestbooks — 방명록 작성 (인증 불필요)
router.post(
  "/",
  validate({ body: guestbookCreateSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await guestbookService.createGuestbook(req.body);
      res.status(201).json(apiResponse.created("방명록 작성 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// ─── Protected ───────────────────────────────────────────

// GET /api/guestbooks/subscribe?weddingId=1 — SSE 실시간 알림 (ADMIN/HOST)
router.get(
  "/subscribe",
  authenticate,
  requireAdminOrHost,
  async (req: Request, res: Response) => {
    const weddingId = Number(req.query.weddingId);
    if (!weddingId || isNaN(weddingId)) {
      res.status(400).json(apiResponse.error(400, "weddingId가 필요합니다."));
      return;
    }

    // SSE 헤더 설정
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Redis subscriber (pub/sub은 별도 인스턴스 필요)
    const subscriber = new Redis(env.REDIS_URL);
    const channel = `guestbook:wedding:${weddingId}`;

    subscriber.subscribe(channel);
    subscriber.on("message", (_ch: string, message: string) => {
      res.write(`data: ${message}\n\n`);
    });

    // 연결 유지 heartbeat (30초)
    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 30_000);

    // 클라이언트 연결 끊김 시 정리
    req.on("close", () => {
      clearInterval(heartbeat);
      subscriber.unsubscribe(channel);
      subscriber.disconnect();
    });
  },
);

// DELETE /api/guestbooks/:id — 방명록 삭제 (ADMIN/HOST)
router.delete(
  "/:id",
  authenticate,
  requireAdminOrHost,
  validate({ params: guestbookDeleteParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as { id: number };
      await guestbookService.deleteGuestbook(req.userId!, id);
      res.json(apiResponse.ok("방명록 삭제 성공", null));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
