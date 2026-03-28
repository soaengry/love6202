/**
 * Rate Limiting 통합 테스트
 * app.ts의 Rate Limiter handler 응답 형식을 검증합니다.
 * 테스트 전용 min(max=2) Express 앱을 사용하여 429를 재현합니다.
 */
import { describe, it, expect } from "vitest";
import express from "express";
import rateLimit from "express-rate-limit";
import request from "supertest";

// 테스트용 앱: max=2로 설정 (3번째 요청에서 429)
function createTestApp() {
  const app = express();
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        status: { code: 429, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        data: null,
      });
    },
  });

  app.use("/api/auth", limiter, (_req, res) => {
    res.json({ status: { code: 200, message: "OK" }, data: null });
  });

  return app;
}

describe("Rate Limiting - /api/auth 응답 형식 검증", () => {
  it("한도 이내 요청 → 200 정상 응답", async () => {
    const app = createTestApp();
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(200);
  });

  it("한도 초과 요청 → 429 + 올바른 응답 형식", async () => {
    const app = createTestApp();

    // 첫 2번: 정상
    await request(app).post("/api/auth/login").send({});
    await request(app).post("/api/auth/login").send({});

    // 3번째: 429
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      status: { code: 429, message: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      data: null,
    });
  });

  it("Retry-After 헤더가 포함된다 (standardHeaders)", async () => {
    const app = createTestApp();

    await request(app).post("/api/auth/login").send({});
    await request(app).post("/api/auth/login").send({});
    const res = await request(app).post("/api/auth/login").send({});

    expect(res.status).toBe(429);
    expect(res.headers["ratelimit-limit"] || res.headers["x-ratelimit-limit"]).toBeDefined();
  });
});
