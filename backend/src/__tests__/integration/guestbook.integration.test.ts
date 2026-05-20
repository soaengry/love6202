import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ── 모킹 ────────────────────────────────────────────────
const prismaMock = {
  wedding: {
    findUnique: vi.fn(),
  },
  guestbook: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

const redisMock = {
  setex: vi.fn().mockResolvedValue("OK"),
  get: vi.fn().mockResolvedValue(null),
  del: vi.fn().mockResolvedValue(1),
  keys: vi.fn().mockResolvedValue([]),
  ttl: vi.fn().mockResolvedValue(86400),
  publish: vi.fn().mockResolvedValue(1),
  subscribe: vi.fn(),
  on: vi.fn(),
  unsubscribe: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock("@/prisma", () => ({ default: prismaMock }));
vi.mock("@/config/redis", () => ({ default: redisMock }));
vi.mock("ioredis", () => ({
  default: vi.fn().mockImplementation(function () { return redisMock; }),
}));

const app = (await import("@/app")).default;

const TEST_SECRET = "test-jwt-secret-for-testing-only";
const CSRF = "test-csrf-token";

function makeHostToken(userId = 1, weddingId = 10) {
  return jwt.sign(
    { userId, email: "host@example.com", role: "HOST", tokenVersion: 0, weddingId },
    TEST_SECRET,
    { expiresIn: 3600, algorithm: "HS256" },
  );
}

function makeAdminToken() {
  return jwt.sign(
    { userId: 99, email: "admin@example.com", role: "ADMIN", tokenVersion: 0 },
    TEST_SECRET,
    { expiresIn: 3600, algorithm: "HS256" },
  );
}

const mockWedding = { id: 10, title: "우리의 결혼식", deletedAt: null };

const mockGuestbookEntry = {
  id: 1,
  weddingId: 10,
  name: "홍길동",
  content: "축하드립니다!",
  type: "NORMAL",
  rotation: 2.5,
  createdAt: new Date("2024-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
  redisMock.publish.mockResolvedValue(1);
});

describe("POST /api/guestbooks", () => {
  it("유효한 초대장 → 201, 방명록 생성 및 Redis publish 호출", async () => {
    prismaMock.wedding.findUnique.mockResolvedValue(mockWedding);
    prismaMock.guestbook.create.mockResolvedValue(mockGuestbookEntry);

    const res = await request(app)
      .post("/api/guestbooks")
      .set("Cookie", `csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF)
      .send({
        weddingId: 10,
        name: "홍길동",
        content: "축하드립니다!",
        type: "post_01",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("홍길동");
    expect(redisMock.publish).toHaveBeenCalledWith(
      "guestbook:wedding:10",
      expect.any(String),
    );
  });

  it("존재하지 않는 초대장 → 404", async () => {
    prismaMock.wedding.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/guestbooks")
      .set("Cookie", `csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF)
      .send({
        weddingId: 999,
        name: "홍길동",
        content: "축하드립니다!",
        type: "post_01",
      });

    expect(res.status).toBe(404);
  });

  it("필수 필드 누락 → 400 (validation)", async () => {
    const res = await request(app)
      .post("/api/guestbooks")
      .set("Cookie", `csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF)
      .send({
        weddingId: 10,
        // name 누락
        content: "축하드립니다!",
        type: "post_01",
      });

    expect(res.status).toBe(400);
    expect(redisMock.publish).not.toHaveBeenCalled();
  });

  it("content 빈 문자열 → 400 (validation)", async () => {
    const res = await request(app)
      .post("/api/guestbooks")
      .set("Cookie", `csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF)
      .send({
        weddingId: 10,
        name: "홍길동",
        content: "",
        type: "post_01",
      });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/guestbooks", () => {
  it("페이지네이션 응답 형식 검증", async () => {
    prismaMock.guestbook.findMany.mockResolvedValue([mockGuestbookEntry]);
    prismaMock.guestbook.count.mockResolvedValue(1);

    const res = await request(app).get("/api/guestbooks?weddingId=10&page=0&size=10");

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      items: expect.any(Array),
      totalCount: 1,
      page: 0,
      size: 10,
      hasNext: false,
    });
  });

  it("hasNext 계산: totalCount > skip + take → true", async () => {
    prismaMock.guestbook.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ ...mockGuestbookEntry, id: i + 1 })),
    );
    prismaMock.guestbook.count.mockResolvedValue(25);

    const res = await request(app).get("/api/guestbooks?weddingId=10&page=0&size=10");

    expect(res.body.data.hasNext).toBe(true);
  });

  it("weddingId 없음 → 400", async () => {
    const res = await request(app).get("/api/guestbooks");

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/guestbooks/:id", () => {
  it("HOST가 자기 초대장의 방명록 삭제 → 200", async () => {
    const hostToken = makeHostToken(1, 10);
    prismaMock.guestbook.findUnique.mockResolvedValue(mockGuestbookEntry);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      role: "HOST",
      weddingId: 10,
    });
    prismaMock.guestbook.delete.mockResolvedValue(mockGuestbookEntry);

    const res = await request(app)
      .delete("/api/guestbooks/1")
      .set("Cookie", `access_token=${hostToken}; csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF);

    expect(res.status).toBe(200);
    expect(prismaMock.guestbook.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("HOST가 다른 초대장의 방명록 삭제 시도 → 403", async () => {
    const hostToken = makeHostToken(1, 10);
    // 방명록의 weddingId가 20 (다른 초대장)
    prismaMock.guestbook.findUnique.mockResolvedValue({
      ...mockGuestbookEntry,
      weddingId: 20,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      role: "HOST",
      weddingId: 10, // 다른 weddingId
    });

    const res = await request(app)
      .delete("/api/guestbooks/1")
      .set("Cookie", `access_token=${hostToken}; csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF);

    expect(res.status).toBe(403);
    expect(prismaMock.guestbook.delete).not.toHaveBeenCalled();
  });

  it("ADMIN은 모든 방명록 삭제 가능 → 200", async () => {
    const adminToken = makeAdminToken();
    prismaMock.guestbook.findUnique.mockResolvedValue(mockGuestbookEntry);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 99,
      role: "ADMIN",
      weddingId: null,
    });
    prismaMock.guestbook.delete.mockResolvedValue(mockGuestbookEntry);

    const res = await request(app)
      .delete("/api/guestbooks/1")
      .set("Cookie", `access_token=${adminToken}; csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF);

    expect(res.status).toBe(200);
  });

  it("존재하지 않는 방명록 → 404", async () => {
    const adminToken = makeAdminToken();
    prismaMock.guestbook.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/guestbooks/999")
      .set("Cookie", `access_token=${adminToken}; csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF);

    expect(res.status).toBe(404);
  });

  it("인증 없음 → 401", async () => {
    const res = await request(app)
      .delete("/api/guestbooks/1")
      .set("Cookie", `csrf_token=${CSRF}`)
      .set("x-csrf-token", CSRF);

    expect(res.status).toBe(401);
  });
});
