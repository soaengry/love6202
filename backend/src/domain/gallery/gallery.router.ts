import { Router, Request, Response, NextFunction } from "express";
import { authenticate, requireAdminOrHost } from "@/middleware/auth";
import { uploadGalleryImages } from "@/middleware/upload";
import { validate } from "@/middleware/validate";
import { apiResponse } from "@/util/apiResponse";
import { galleryQuerySchema, galleryDeleteBodySchema } from "./gallery.schema";
import * as galleryService from "./gallery.service";

const router = Router();

// ─── Public ─────────────────────────────────────────────

// GET /api/galleries?weddingId=1&page=0&size=10 — 갤러리 목록 공개 조회
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, size, weddingId } = galleryQuerySchema.parse(req.query);

      if (!weddingId) {
        return res.status(400).json(apiResponse.error(400, "weddingId가 필요합니다."));
      }

      const result = await galleryService.getGalleries(weddingId, page, size);
      res.json(apiResponse.ok("갤러리 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// ─── Protected ──────────────────────────────────────────

router.use(authenticate);

// POST /api/galleries — 갤러리 이미지 업로드
router.post(
  "/",
  requireAdminOrHost,
  uploadGalleryImages,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json(apiResponse.error(400, "업로드할 이미지가 없습니다."));
      }
      const result = await galleryService.uploadImages(req.userId!, files);
      res.status(201).json(apiResponse.created("갤러리 업로드 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/galleries — 갤러리 이미지 삭제 (배치)
router.delete(
  "/",
  requireAdminOrHost,
  validate({ body: galleryDeleteBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ids } = req.body as { ids: number[] };
      await galleryService.deleteGalleries(req.userId!, ids);
      res.json(apiResponse.ok("갤러리 삭제 성공", null));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
