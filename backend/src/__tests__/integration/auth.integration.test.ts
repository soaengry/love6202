import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ── 모킹 선언 ────────────────────────────────────────────
const prismaMock = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

const redisMock = {
  setex: vi.fn().mockResolvedValue("OK"),
  get: vi.fn(),
  del: vi.fn().mockResolvedValue(1),
  keys: vi.fn().mockResolvedValue([]),
  ttl: vi.fn().mockResolvedValue(86400),
  publish: vi.fn().mockResolvedValue(1),
};

vi.mock("@/prisma", () => ({ default: prismaMock }));
vi.mock("@/config/redis", () => ({ default: redisMock }));

// Google OAuth 외부 axios 호출 모킹
vi.mock("axios", async (importOriginal) => {
  const actual = await importOriginal<typeof import("axios")>();
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
      get: vi.fn(),
    },
  };
});

const axios = (await import("axios")).default;
const app = (await import("@/app")).default;

const TEST_SECRET = "test-jwt-secret-for-testing-only";

function makeAccessToken(payload: Record<string, unknown> = {}) {
  return jwt.sign(
    { userId: 1, email: "test@example.com", role: "GUEST", tokenVersion: 0, ...payload },
    TEST_SECRET,
    { expiresIn: 3600, algorithm: "HS256" },
  );
}

function makeRefreshToken(payload: Record<string, unknown> = {}) {
  return jwt.sign(
    { userId: 1, deviceId: "test-device-id", tokenVersion: 0, ...payload },
    TEST_SECRET,
    { expiresIn: 86400, algorithm: "HS256" },
  );
}

const mockUser = {
  id: 1,
  email: "test@example.com",
  nickname: "테스터",
  profileImageUrl: null,
  role: "GUEST",
  providerId: "google-123",
  tokenVersion: 0,
  version: 0,
  weddingId: null,
  deletedAt: null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  redisMock.keys.mockResolvedValue([]);
  redisMock.setex.mockResolvedValue("OK");
  redisMock.del.mockResolvedValue(1);
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    // Google OAuth 응답 모킹
    (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        access_token: "google-access-token",
        id_token: "google-id-token",
      },
    });
    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        sub: "google-123",
        email: "test@example.com",
        name: "테스터",
        picture: "https://example.com/pic.jpg",
      },
    });
  });

  it("신규 유저 → 200, Set-Cookie 헤더 포함", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue(null); // nickname check
    prismaMock.user.create.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ code: "google-auth-code", deviceId: "test-device-id" });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("기존 유저 → 200, 유저 정보 반환", async () => {
    prismaMock.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ code: "google-auth-code", deviceId: "test-device-id" });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("test@example.com");
  });

  it("30일 이내 삭제된 계정 → 복구 후 200", async () => {
    const deletedRecently = {
      ...mockUser,
      deletedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5일 전
    };
    prismaMock.user.findFirst.mockResolvedValue(deletedRecently);
    prismaMock.user.update.mockResolvedValue({ ...mockUser, deletedAt: null });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ code: "google-auth-code", deviceId: "test-device-id" });

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it("30일 초과 삭제된 계정 → 410 (영구 삭제)", async () => {
    const deletedLongAgo = {
      ...mockUser,
      deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31일 전
    };
    prismaMock.user.findFirst.mockResolvedValue(deletedLongAgo);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ code: "google-auth-code", deviceId: "test-device-id" });

    expect(res.status).toBe(410);
  });

  it("code 없음 → 400 (validation)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ deviceId: "test-device-id" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/refresh", () => {
  it("유효한 refresh 쿠키 → 200, 새 토큰 set-cookie", async () => {
    const refreshToken = makeRefreshToken();
    redisMock.get.mockResolvedValue(
      require("crypto").createHash("sha256").update(refreshToken).digest("hex"),
    );
    prismaMock.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${refreshToken}`)
      .send({ deviceId: "test-device-id" });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("refresh 쿠키 없음 → 401", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ deviceId: "test-device-id" });

    expect(res.status).toBe(401);
  });

  it("Redis에 없는 토큰 (유효하지 않은 refresh) → 401", async () => {
    const refreshToken = makeRefreshToken();
    redisMock.get.mockResolvedValue(null); // Redis에 없음

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${refreshToken}`)
      .send({ deviceId: "test-device-id" });

    expect(res.status).toBe(401);
  });

  it("tokenVersion 불일치 → 401, 모든 토큰 삭제", async () => {
    const refreshToken = makeRefreshToken({ tokenVersion: 0 });
    redisMock.get.mockResolvedValue(
      require("crypto").createHash("sha256").update(refreshToken).digest("hex"),
    );
    // DB의 tokenVersion은 1 (변경됨)
    prismaMock.user.findFirst.mockResolvedValue({ ...mockUser, tokenVersion: 1 });
    redisMock.keys.mockResolvedValue(["refresh:1:device-1"]);

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refresh_token=${refreshToken}`)
      .send({ deviceId: "test-device-id" });

    expect(res.status).toBe(401);
    expect(redisMock.del).toHaveBeenCalled();
  });
});

describe("POST /api/auth/logout", () => {
  it("인증된 유저 → 200, 쿠키 삭제", async () => {
    const accessToken = makeAccessToken();
    redisMock.del.mockResolvedValue(1);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", `access_token=${accessToken}`)
      .send({ deviceId: "test-device-id" });

    expect(res.status).toBe(200);
    // clearCookie는 Set-Cookie에 만료된 날짜로 나타남
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("인증 없음 → 401", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .send({ deviceId: "test-device-id" });

    expect(res.status).toBe(401);
  });
});

