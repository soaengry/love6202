import { Request, Response, NextFunction } from "express";
import { AppError } from "@/util/appError";
import { ZodError } from "zod";
import multer from "multer";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "파일 크기가 너무 큽니다. (최대 50MB)"
      : "파일 업로드에 실패했습니다.";
    return res.status(400).json({
      status: { code: 400, message },
      data: null,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: { code: err.statusCode, message: err.message },
      data: null,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: { code: 400, message: "유효성 검증 실패" },
      data: err.issues,
    });
  }

  if (process.env.NODE_ENV === "production") {
    console.error(JSON.stringify({ message: err.message, name: err.name, ts: new Date().toISOString() }));
  } else {
    console.error("Unhandled error:", err);
  }
  res.status(500).json({
    status: { code: 500, message: "Internal Server Error" },
    data: null,
  });
}
