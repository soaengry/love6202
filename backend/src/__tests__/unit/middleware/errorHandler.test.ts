import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import { AppError } from "@/util/appError";
import { errorHandler } from "@/middleware/errorHandler";

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const dummyReq = {} as Request;
const dummyNext = vi.fn() as NextFunction;

describe("errorHandler", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("AppError 처리", () => {
    it("401 AppError → status 401 + 올바른 body 반환", () => {
      const err = new AppError("UNAUTHORIZED", 401, "인증이 필요합니다.");
      const res = mockRes();

      errorHandler(err, dummyReq, res, dummyNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: { code: 401, message: "인증이 필요합니다." },
        data: null,
      });
    });

    it("404 AppError → status 404 반환", () => {
      const err = new AppError("NOT_FOUND", 404, "리소스를 찾을 수 없습니다.");
      const res = mockRes();

      errorHandler(err, dummyReq, res, dummyNext);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("409 AppError → status 409 반환", () => {
      const err = new AppError("DUPLICATE", 409, "중복입니다.");
      const res = mockRes();

      errorHandler(err, dummyReq, res, dummyNext);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("AppError data는 항상 null", () => {
      const err = new AppError("ANY_ERROR", 400, "msg");
      const res = mockRes();

      errorHandler(err, dummyReq, res, dummyNext);

      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.data).toBeNull();
    });
  });

  describe("ZodError 처리", () => {
    it("ZodError → status 400 + issues 반환", () => {
      let zodError: ZodError;
      try {
        z.object({ name: z.string().min(1) }).parse({ name: "" });
      } catch (e) {
        zodError = e as ZodError;
      }
      const res = mockRes();

      errorHandler(zodError!, dummyReq, res, dummyNext);

      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.status.code).toBe(400);
      expect(body.status.message).toBe("유효성 검증 실패");
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe("알 수 없는 에러 처리", () => {
    it("일반 Error → status 500 + Internal Server Error", () => {
      const err = new Error("Something went wrong");
      const res = mockRes();

      errorHandler(err, dummyReq, res, dummyNext);

      expect(res.status).toHaveBeenCalledWith(500);
      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.status.code).toBe(500);
      expect(body.status.message).toBe("Internal Server Error");
    });

    it("일반 Error → console.error 호출", () => {
      const err = new Error("Unexpected");
      const res = mockRes();

      errorHandler(err, dummyReq, res, dummyNext);

      expect(consoleSpy).toHaveBeenCalledOnce();
    });

    it("500 에러의 data는 null", () => {
      const err = new Error("Unknown");
      const res = mockRes();

      errorHandler(err, dummyReq, res, dummyNext);

      const body = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(body.data).toBeNull();
    });
  });
});
