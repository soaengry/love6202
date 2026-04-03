import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { validate } from "@/middleware/validate";

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {} as Record<string, string>,
    query: {},
    ...overrides,
  } as unknown as Request;
}

describe("validate middleware", () => {
  describe("body 검증", () => {
    const bodySchema = z.object({
      name: z.string().min(1),
      age: z.number(),
    });

    it("유효한 body → req.body를 파싱된 값으로 교체 후 next()", () => {
      const req = mockReq({ body: { name: "홍길동", age: 25 } });
      const next = vi.fn() as NextFunction;

      validate({ body: bodySchema })(req, {} as Response, next);

      expect(req.body).toEqual({ name: "홍길동", age: 25 });
      expect(next).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledWith(); // 에러 없이 호출
    });

    it("유효하지 않은 body → ZodError throw", () => {
      const req = mockReq({ body: { name: "", age: "not-a-number" } });
      const next = vi.fn() as NextFunction;

      expect(() =>
        validate({ body: bodySchema })(req, {} as Response, next),
      ).toThrow(ZodError);
    });

    it("필드 누락 → ZodError throw", () => {
      const req = mockReq({ body: { name: "홍길동" } });
      const next = vi.fn() as NextFunction;

      expect(() =>
        validate({ body: bodySchema })(req, {} as Response, next),
      ).toThrow(ZodError);
    });
  });

  describe("params 검증", () => {
    const paramsSchema = z.object({
      id: z.coerce.number().int().positive(),
    });

    it("유효한 params → Object.assign 후 next()", () => {
      const req = mockReq({ params: { id: "42" } as unknown as Record<string, string> });
      const next = vi.fn() as NextFunction;

      validate({ params: paramsSchema })(req, {} as Response, next);

      expect((req.params as unknown as { id: number }).id).toBe(42);
      expect(next).toHaveBeenCalledWith();
    });

    it("유효하지 않은 params → ZodError throw", () => {
      const req = mockReq({ params: { id: "not-a-number" } as unknown as Record<string, string> });
      const next = vi.fn() as NextFunction;

      expect(() =>
        validate({ params: paramsSchema })(req, {} as Response, next),
      ).toThrow(ZodError);
    });
  });

  describe("query 검증", () => {
    const querySchema = z.object({
      page: z.coerce.number().default(0),
      size: z.coerce.number().default(10),
    });

    it("유효한 query → 기존 쿼리 삭제 후 파싱된 값으로 대체", () => {
      const req = mockReq({ query: { page: "1", size: "20", extra: "should-be-removed" } });
      const next = vi.fn() as NextFunction;

      validate({ query: querySchema })(req, {} as Response, next);

      expect(req.query.page).toBe(1);
      expect(req.query.size).toBe(20);
      expect(req.query.extra).toBeUndefined();
      expect(next).toHaveBeenCalledWith();
    });

    it("query 없음 → 기본값 사용", () => {
      const req = mockReq({ query: {} });
      const next = vi.fn() as NextFunction;

      validate({ query: querySchema })(req, {} as Response, next);

      expect(req.query.page).toBe(0);
      expect(req.query.size).toBe(10);
    });
  });

  it("스키마 미지정 → req 그대로 유지 후 next()", () => {
    const req = mockReq({ body: { anything: true } });
    const next = vi.fn() as NextFunction;

    validate({})(req, {} as Response, next);

    expect(req.body).toEqual({ anything: true });
    expect(next).toHaveBeenCalledWith();
  });
});
