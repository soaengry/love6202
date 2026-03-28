import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
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
