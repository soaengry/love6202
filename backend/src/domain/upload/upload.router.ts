import { Router, Request, Response, NextFunction } from "express";
import { optionalAuth } from "@/middleware/auth";
import { uploadUserImages } from "@/middleware/upload";
import { validate } from "@/middleware/validate";
import { apiResponse } from "@/util/apiResponse";
import { AppError } from "@/util/appError";
import { UploadErrorCode } from "./upload.error";
import { uploadQuerySchema, uploadDeleteParamsSchema } from "./upload.schema";
import { streamFromDrive } from "@/service/googleDrive.service";
import * as uploadService from "./upload.service";

const router = Router();

// GET /api/uploads/image/:driveFileId — Google Drive 이미지 프록시 (인증 불필요)
router.get(
  "/image/:driveFileId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driveFileId } = req.params;
      const { data, mimeType } = await streamFromDrive(driveFileId);

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(data);
    } catch (err) {
      next(err);
    }
  },
);

// 모든 라우트에 optionalAuth 적용 (userId 있으면 주입)
router.use(optionalAuth);

// GET /api/uploads/me?weddingId=1 — 내 업로드 조회
router.get(
  "/me",
  validate({ query: uploadQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.sessionId;
      if (!sessionId) {
        throw AppError.from(UploadErrorCode.UPLOAD_SESSION_REQUIRED);
      }

      const { weddingId } = uploadQuerySchema.parse(req.query);
      const result = await uploadService.getMyUploads(sessionId, req.userId, weddingId);
      res.json(apiResponse.ok("내 업로드 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/uploads?weddingId=1 — 사진 업로드
router.post(
  "/",
  uploadUserImages,
  validate({ query: uploadQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.sessionId;
      if (!sessionId) {
        throw AppError.from(UploadErrorCode.UPLOAD_SESSION_REQUIRED);
      }

      const { weddingId } = uploadQuerySchema.parse(req.query);
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json(apiResponse.error(400, "업로드할 이미지가 없습니다."));
      }

      const result = await uploadService.uploadImages(sessionId, req.userId, weddingId, files);
      res.status(201).json(apiResponse.created("업로드 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/uploads/:id — 사진 삭제
router.delete(
  "/:id",
  validate({ params: uploadDeleteParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.sessionId;
      if (!sessionId) {
        throw AppError.from(UploadErrorCode.UPLOAD_SESSION_REQUIRED);
      }

      const { id } = uploadDeleteParamsSchema.parse(req.params);
      await uploadService.deleteUpload(sessionId, req.userId, req.userRole, id);
      res.json(apiResponse.ok("삭제 성공", null));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
