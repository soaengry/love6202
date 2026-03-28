import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

vi.mock("@/config/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
    JWT_ACCESS_EXPIRATION: 3_600_000,
    JWT_REFRESH_EXPIRATION: 86_400_000,
  },
}));

const { authenticate, requireAdmin, requireAdminOrHost, optionalAuth } =
  await import("@/middleware/auth");

function makeToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, "test-secret", {
    expiresIn: 3600,
    algorithm: "HS256",
  });
}

function mockReq(overrides: Partial<Request> = {}): Request {
  return { cookies: {}, ...overrides } as Request;
}

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe("authenticate", () => {
  it("유효한 access_token 쿠키 → req.userId, req.userRole 설정 후 next()", () => {
    const token = makeToken({ userId: 42, email: "a@b.com", role: "GUEST", tokenVersion: 0 });
    const req = mockReq({ cookies: { access_token: token } });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect((req as any).userId).toBe(42);
    expect((req as any).userRole).toBe("GUEST");
    expect(next).toHaveBeenCalledOnce();
  });

  it("쿠키 없음 → 401 반환", () => {
    const req = mockReq({ cookies: {} });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("유효하지 않은 토큰 → 401 반환", () => {
    const req = mockReq({ cookies: { access_token: "invalid.token.here" } });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("만료된 토큰 → 401 반환", () => {
    const expired = jwt.sign({ userId: 1 }, "test-secret", {
      expiresIn: -1,
      algorithm: "HS256",
    });
    const req = mockReq({ cookies: { access_token: expired } });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("requireAdmin", () => {
  it("role=ADMIN → next() 호출", () => {
    const req = { userRole: "ADMIN" } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("role=HOST → 403 반환", () => {
    const req = { userRole: "HOST" } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("role=GUEST → 403 반환", () => {
    const req = { userRole: "GUEST" } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("requireAdminOrHost", () => {
  it("role=ADMIN → next() 호출", () => {
    const req = { userRole: "ADMIN" } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdminOrHost(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("role=HOST → next() 호출", () => {
    const req = { userRole: "HOST" } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdminOrHost(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("role=GUEST → 403 반환", () => {
    const req = { userRole: "GUEST" } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    requireAdminOrHost(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("optionalAuth", () => {
  it("유효한 토큰 → req.userId 설정 후 next()", () => {
    const token = makeToken({ userId: 7, email: "a@b.com", role: "HOST", tokenVersion: 1 });
    const req = mockReq({ cookies: { access_token: token } });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    optionalAuth(req, res, next);

    expect((req as any).userId).toBe(7);
    expect(next).toHaveBeenCalledOnce();
  });

  it("토큰 없음 → req.userId 미설정, next() 호출", () => {
    const req = mockReq({ cookies: {} });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    optionalAuth(req, res, next);

    expect((req as any).userId).toBeUndefined();
    expect(next).toHaveBeenCalledOnce();
  });

  it("유효하지 않은 토큰 → 에러 없이 next() 호출 (무시)", () => {
    const req = mockReq({ cookies: { access_token: "bad.token" } });
    const res = mockRes();
    const next = vi.fn() as NextFunction;

    expect(() => optionalAuth(req, res, next)).not.toThrow();
    expect(next).toHaveBeenCalledOnce();
    expect((req as any).userId).toBeUndefined();
  });
});
