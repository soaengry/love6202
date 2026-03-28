import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "@/middleware/auth";
import { uploadWeddingImages } from "@/middleware/upload";
import { validate } from "@/middleware/validate";
import { apiResponse } from "@/util/apiResponse";
import { createWeddingBodySchema, updateWeddingBodySchema, weddingIdParamSchema } from "./wedding.schema";
import * as weddingService from "./wedding.service";

const router = Router();

// ─── Public ─────────────────────────────────────────────

// GET /api/weddings/latest — 최신 초대장 공개 조회
router.get(
  "/latest",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await weddingService.getLatestWedding();
      res.json(apiResponse.ok("초대장 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// ─── Protected ──────────────────────────────────────────

router.use(authenticate);

// GET /api/weddings/me — 내 초대장 조회 (/:id 보다 먼저 선언)
router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await weddingService.getMyWedding(req.userId!);
    res.json(apiResponse.ok("초대장 조회 성공", result));
  } catch (err) {
    next(err);
  }
});

// GET /api/weddings/:id — 초대장 공개 조회
router.get(
  "/:id",
  validate({ params: weddingIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as { id: number };
      const result = await weddingService.getWedding(id);
      res.json(apiResponse.ok("초대장 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/weddings — 초대장 생성
router.post(
  "/",
  uploadWeddingImages,
  (req: Request, _res: Response, next: NextFunction) => {
    // multipart에서 JSON data 필드 파싱
    if (typeof req.body.data === "string") {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validate({ body: createWeddingBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const result = await weddingService.createWedding(req.userId!, req.body, {
        heroImages: files?.heroImages,
        groomProfileImage: files?.groomProfileImage,
        brideProfileImage: files?.brideProfileImage,
      });
      res.status(201).json(apiResponse.created("초대장 생성 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/weddings/:id — 초대장 수정
router.put(
  "/:id",
  uploadWeddingImages,
  (req: Request, _res: Response, next: NextFunction) => {
    if (typeof req.body.data === "string") {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validate({ body: updateWeddingBodySchema, params: weddingIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as { id: number };
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const result = await weddingService.updateWedding(req.userId!, id, req.body, {
        heroImages: files?.heroImages,
        groomProfileImage: files?.groomProfileImage,
        brideProfileImage: files?.brideProfileImage,
      });
      res.json(apiResponse.ok("초대장 수정 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/weddings/:id — 초대장 삭제 (soft delete)
router.delete(
  "/:id",
  validate({ params: weddingIdParamSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as { id: number };
      await weddingService.deleteWedding(req.userId!, id);
      res.json(apiResponse.ok("초대장 삭제 성공", null));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
