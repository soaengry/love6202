import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

// env를 모킹한 뒤 jwt 유틸 로드
vi.mock("@/config/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
    JWT_ACCESS_EXPIRATION: 3_600_000,
    JWT_REFRESH_EXPIRATION: 86_400_000,
  },
}));

const { generateAccessToken, generateRefreshToken, verifyToken } = await import(
  "@/util/jwt"
);

const mockUser = {
  id: 1,
  email: "test@example.com",
  role: "GUEST",
  tokenVersion: 0,
};

describe("generateAccessToken", () => {
  it("올바른 payload를 포함한 JWT를 생성한다", () => {
    const token = generateAccessToken(mockUser);
    const decoded = jwt.decode(token) as Record<string, unknown>;

    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe("test@example.com");
    expect(decoded.role).toBe("GUEST");
    expect(decoded.tokenVersion).toBe(0);
  });

  it("HS256 알고리즘으로 서명된다", () => {
    const token = generateAccessToken(mockUser);
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString(),
    );
    expect(header.alg).toBe("HS256");
  });

  it("만료 시간이 설정된다", () => {
    const token = generateAccessToken(mockUser);
    const decoded = jwt.decode(token) as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    expect(decoded.exp as number).toBeGreaterThan(now);
    expect(decoded.exp as number).toBeLessThanOrEqual(now + 3600 + 1);
  });
});

describe("generateRefreshToken", () => {
  it("userId, deviceId, tokenVersion을 payload에 포함한다", () => {
    const token = generateRefreshToken(1, "device-uuid", 0);
    const decoded = jwt.decode(token) as Record<string, unknown>;

    expect(decoded.userId).toBe(1);
    expect(decoded.deviceId).toBe("device-uuid");
    expect(decoded.tokenVersion).toBe(0);
  });

  it("HS256 알고리즘으로 서명된다", () => {
    const token = generateRefreshToken(1, "device-uuid", 0);
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64url").toString(),
    );
    expect(header.alg).toBe("HS256");
  });
});

describe("verifyToken", () => {
  it("유효한 토큰 → payload 반환", () => {
    const token = generateAccessToken(mockUser);
    const payload = verifyToken(token);

    expect(payload.userId).toBe(1);
    expect(payload.email).toBe("test@example.com");
    expect(payload.role).toBe("GUEST");
  });

  it("만료된 토큰 → 에러 throw", () => {
    const expiredToken = jwt.sign(
      { userId: 1 },
      "test-secret",
      { expiresIn: -1, algorithm: "HS256" },
    );
    expect(() => verifyToken(expiredToken)).toThrow();
  });

  it("잘못된 시크릿으로 서명된 토큰 → 에러 throw", () => {
    const token = jwt.sign({ userId: 1 }, "wrong-secret", {
      algorithm: "HS256",
    });
    expect(() => verifyToken(token)).toThrow();
  });

  it("변조된 토큰 → 에러 throw", () => {
    const token = generateAccessToken(mockUser);
    const parts = token.split(".");
    const tamperedToken = `${parts[0]}.${parts[1]}tampered.${parts[2]}`;
    expect(() => verifyToken(tamperedToken)).toThrow();
  });

  it("완전히 잘못된 문자열 → 에러 throw", () => {
    expect(() => verifyToken("not.a.jwt")).toThrow();
  });
});
