import { Router, Request, Response, NextFunction } from "express";
import { authenticate, optionalAuth, requireAdminOrHost } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { apiResponse } from "@/util/apiResponse";
import {
  rsvpQuerySchema,
  rsvpListQuerySchema,
  rsvpParamsSchema,
  rsvpCreateSchema,
  rsvpUpdateSchema,
} from "./rsvp.schema";
import * as rsvpService from "./rsvp.service";

const router = Router();

// ─── Public (선택적 인증) ─────────────────────────────────

// POST /api/rsvp — 참석 의향서 제출
router.post(
  "/",
  optionalAuth,
  validate({ body: rsvpCreateSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rsvpService.createRsvp(
        req.sessionId!,
        req.userId,
        req.body,
      );
      res.status(201).json(apiResponse.created("참석 의향서 제출 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/rsvp/me?weddingId= — 내 참석 의향서 조회
router.get(
  "/me",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = rsvpQuerySchema.parse(req.query);
      const result = await rsvpService.getMyRsvp(weddingId, req.sessionId!, req.userId);
      if (!result) {
        res.status(404).json(apiResponse.error(404, "참석 의향서가 없습니다."));
        return;
      }
      res.json(apiResponse.ok("내 참석 의향서 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/rsvp/:id — 참석 의향서 수정
router.put(
  "/:id",
  optionalAuth,
  validate({ params: rsvpParamsSchema, body: rsvpUpdateSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as { id: number };
      const result = await rsvpService.updateRsvp(id, req.sessionId!, req.userId, req.body);
      res.json(apiResponse.ok("참석 의향서 수정 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/rsvp/:id — 참석 의향서 취소
router.delete(
  "/:id",
  optionalAuth,
  validate({ params: rsvpParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as { id: number };
      await rsvpService.deleteRsvp(id, req.sessionId!, req.userId, req.userRole);
      res.json(apiResponse.ok("참석 의향서 취소 성공", null));
    } catch (err) {
      next(err);
    }
  },
);

// ─── Protected (ADMIN/HOST) ───────────────────────────────

// GET /api/rsvp/stats?weddingId= — 통계 조회
router.get(
  "/stats",
  authenticate,
  requireAdminOrHost,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = rsvpQuerySchema.parse(req.query);
      const result = await rsvpService.getRsvpStats(weddingId, req.userId!, req.userRole!);
      res.json(apiResponse.ok("참석 통계 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/rsvp/list?weddingId=&page=&size= — 전체 목록 조회
router.get(
  "/list",
  authenticate,
  requireAdminOrHost,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId, page, size } = rsvpListQuerySchema.parse(req.query);
      const result = await rsvpService.listRsvps(weddingId, page, size, req.userId!, req.userRole!);
      res.json(apiResponse.ok("참석 의향서 목록 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/rsvp/export?weddingId= — CSV 내보내기
router.get(
  "/export",
  authenticate,
  requireAdminOrHost,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { weddingId } = rsvpQuerySchema.parse(req.query);
      const csv = await rsvpService.exportRsvpCsv(weddingId, req.userId!, req.userRole!);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="rsvp_${weddingId}_${new Date().toISOString().slice(0, 10)}.csv"`,
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
