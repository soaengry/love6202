import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// Redis 모킹
const redisMock = {
  setex: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  ttl: vi.fn(),
  scan: vi.fn(),
};

vi.mock("@/config/redis", () => ({ default: redisMock }));

const refreshTokenService = await import("@/service/refreshToken.service");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("save", () => {
  it("bcrypt 해시된 토큰을 1일 TTL로 저장한다", async () => {
    await refreshTokenService.save(1, "device-abc", "raw-token");

    expect(redisMock.setex).toHaveBeenCalledWith(
      "refresh:1:device-abc",
      86400,
      expect.stringMatching(/^\$2b\$/),
    );
  });
});

describe("verify", () => {
  it("해시가 일치하면 true 반환", async () => {
    const hashed = await bcrypt.hash("raw-token", 1);
    redisMock.get.mockResolvedValue(hashed);

    const result = await refreshTokenService.verify(1, "device-abc", "raw-token");

    expect(result).toBe(true);
  });

  it("해시가 일치하지 않으면 false 반환", async () => {
    const hashed = await bcrypt.hash("other-token", 1);
    redisMock.get.mockResolvedValue(hashed);

    const result = await refreshTokenService.verify(1, "device-abc", "raw-token");

    expect(result).toBe(false);
  });

  it("키가 없으면 (null) false 반환", async () => {
    redisMock.get.mockResolvedValue(null);

    const result = await refreshTokenService.verify(1, "device-abc", "raw-token");

    expect(result).toBe(false);
  });
});

describe("deleteByDevice", () => {
  it("올바른 키로 redis.del 호출", async () => {
    await refreshTokenService.deleteByDevice(1, "device-abc");

    expect(redisMock.del).toHaveBeenCalledWith("refresh:1:device-abc");
  });
});

describe("deleteAllByUser", () => {
  it("유저의 모든 키를 삭제한다", async () => {
    redisMock.scan.mockResolvedValue(["0", ["refresh:1:device-a", "refresh:1:device-b"]]);

    await refreshTokenService.deleteAllByUser(1);

    expect(redisMock.del).toHaveBeenCalledWith("refresh:1:device-a", "refresh:1:device-b");
  });

  it("키가 없으면 del을 호출하지 않는다", async () => {
    redisMock.scan.mockResolvedValue(["0", []]);

    await refreshTokenService.deleteAllByUser(1);

    expect(redisMock.del).not.toHaveBeenCalled();
  });
});

describe("countDevices", () => {
  it("키 개수를 정확히 반환한다", async () => {
    redisMock.scan.mockResolvedValue(["0", ["k1", "k2", "k3"]]);

    const count = await refreshTokenService.countDevices(1);

    expect(count).toBe(3);
  });

  it("키 없으면 0 반환", async () => {
    redisMock.scan.mockResolvedValue(["0", []]);

    const count = await refreshTokenService.countDevices(1);

    expect(count).toBe(0);
  });
});

describe("evictOldestDevice", () => {
  it("TTL이 가장 낮은 키(가장 오래된 디바이스)를 삭제한다", async () => {
    redisMock.scan.mockResolvedValue(["0", [
      "refresh:1:device-a",
      "refresh:1:device-b",
      "refresh:1:device-c",
    ]]);
    redisMock.ttl
      .mockResolvedValueOnce(70000)  // device-a
      .mockResolvedValueOnce(10000)  // device-b (oldest)
      .mockResolvedValueOnce(80000); // device-c

    await refreshTokenService.evictOldestDevice(1);

    expect(redisMock.del).toHaveBeenCalledWith("refresh:1:device-b");
  });

  it("키가 없으면 아무것도 하지 않는다", async () => {
    redisMock.scan.mockResolvedValue(["0", []]);

    await refreshTokenService.evictOldestDevice(1);

    expect(redisMock.del).not.toHaveBeenCalled();
    expect(redisMock.ttl).not.toHaveBeenCalled();
  });

  it("키가 1개면 그 키를 삭제한다", async () => {
    redisMock.scan.mockResolvedValue(["0", ["refresh:1:only-device"]]);
    redisMock.ttl.mockResolvedValue(50000);

    await refreshTokenService.evictOldestDevice(1);

    expect(redisMock.del).toHaveBeenCalledWith("refresh:1:only-device");
  });
});
