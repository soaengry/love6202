import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { validateUploadedFiles } from "@/middleware/upload";
import { AppError } from "@/util/appError";

function makeJpegBuffer(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
}

function makePngBuffer(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
}

function makeInvalidBuffer(): Buffer {
  return Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
}

function makeFile(buffer: Buffer): Express.Multer.File {
  return { buffer, fieldname: "image", originalname: "test.jpg", mimetype: "image/jpeg" } as Express.Multer.File;
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { file: undefined, files: undefined, ...overrides } as unknown as Request;
}

function mockRes(): Response {
  return {} as Response;
}

describe("validateUploadedFiles", () => {
  it("파일이 없으면 next()를 호출한다", () => {
    const req = mockReq();
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(); // 인자 없음
  });

  it("유효한 JPEG (req.file) → next() 호출", () => {
    const req = mockReq({ file: makeFile(makeJpegBuffer()) });
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("유효한 PNG (req.file) → next() 호출", () => {
    const req = mockReq({ file: makeFile(makePngBuffer()) });
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("잘못된 magic bytes → AppError(400) 전달", () => {
    const req = mockReq({ file: makeFile(makeInvalidBuffer()) });
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    expect(next).toHaveBeenCalledOnce();
    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(400);
  });

  it("8바이트 미만 버퍼 → AppError(400) 전달", () => {
    const shortBuffer = Buffer.from([0xff, 0xd8, 0xff]);
    const req = mockReq({ file: makeFile(shortBuffer) });
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(400);
  });

  it("req.files 배열: 모두 유효 → next()", () => {
    const req = mockReq({
      files: [makeFile(makeJpegBuffer()), makeFile(makePngBuffer())] as Express.Multer.File[],
    });
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("req.files 배열: 하나라도 유효하지 않음 → AppError(400)", () => {
    const req = mockReq({
      files: [makeFile(makeJpegBuffer()), makeFile(makeInvalidBuffer())] as Express.Multer.File[],
    });
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).statusCode).toBe(400);
  });

  it("req.files 객체 (multer.fields): 유효 → next()", () => {
    const req = mockReq({
      files: {
        heroImages: [makeFile(makeJpegBuffer())],
        profileImage: [makeFile(makePngBuffer())],
      } as Record<string, Express.Multer.File[]>,
    });
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("req.files 객체: 유효하지 않은 파일 포함 → AppError(400)", () => {
    const req = mockReq({
      files: {
        heroImages: [makeFile(makeInvalidBuffer())],
      } as Record<string, Express.Multer.File[]>,
    });
    const next = vi.fn() as NextFunction;

    validateUploadedFiles(req, mockRes(), next);

    const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
  });
});
