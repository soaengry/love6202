import multer, { type FileFilterCallback } from "multer";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/util/appError";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("INVALID_FILE_TYPE", 400, "JPG, PNG 파일만 업로드 가능합니다."));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const uploadProfileImage = upload.single("profileImage");

export const uploadGalleryImages = upload.array("images", 20);

export const uploadUserImages = upload.array("images", 10);

export const uploadWeddingImages = upload.fields([
  { name: "heroImages", maxCount: 4 },
  { name: "groomProfileImage", maxCount: 1 },
  { name: "brideProfileImage", maxCount: 1 },
]);

// magic bytes로 실제 이미지 파일 여부 검증 (MIME 헤더 스푸핑 방지)
function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e &&
    buffer[3] === 0x47 && buffer[4] === 0x0d && buffer[5] === 0x0a &&
    buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return true;
  return false;
}

export function parseMultipartJson(req: Request, _res: Response, next: NextFunction) {
  if (typeof req.body.data === "string") {
    req.body = JSON.parse(req.body.data);
  }
  next();
}

export function validateUploadedFiles(req: Request, _res: Response, next: NextFunction) {
  const files: Express.Multer.File[] = [];

  if (req.file) {
    files.push(req.file);
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      Object.values(req.files).forEach((arr) => files.push(...arr));
    }
  }

  for (const file of files) {
    if (!isValidImageBuffer(file.buffer)) {
      return next(new AppError("INVALID_FILE_TYPE", 400, "유효하지 않은 이미지 파일입니다."));
    }
  }

  next();
}
