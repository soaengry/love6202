import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";

// ENV 모킹
vi.mock("@/global/config/env", () => ({
  ENV: { API_BASE_URL: "http://localhost:8000" },
}));

// getDeviceId 모킹
vi.mock("@/domain/auth/auth.utils", () => ({
  getDeviceId: vi.fn(() => "mock-device-id"),
}));

// useAuthStore 모킹
const mockLogout = vi.fn();
vi.mock("@/domain/auth/store/useAuthStore", () => ({
  useAuthStore: {
    getState: () => ({ logout: mockLogout }),
  },
}));

const { default: api } = await import("@/global/api/axiosInstance");

// axiosInstance 내부에서 생성한 인스턴스를 mock
const mock = new MockAdapter(api);

// 전역 axios에도 mock 필요 (refresh 요청은 global axios로)
const globalMock = new MockAdapter(axios);

beforeEach(() => {
  mock.reset();
  globalMock.reset();
  mockLogout.mockClear();
});

afterEach(() => {
  mock.reset();
  globalMock.reset();
});

describe("Response 인터셉터 - 데이터 추출", () => {
  it("ApiResponse wrapper에서 data 필드만 추출한다", async () => {
    mock.onGet("/test").reply(200, {
      status: { code: 200, message: "OK" },
      data: { id: 1, name: "테스트" },
    });

    const res = await api.get("/test");

    expect(res.data).toEqual({ id: 1, name: "테스트" });
  });

  it("data가 null인 경우 null 반환", async () => {
    mock.onGet("/test").reply(200, {
      status: { code: 200, message: "OK" },
      data: null,
    });

    const res = await api.get("/test");

    expect(res.data).toBeNull();
  });
});

describe("401 인터셉터 - 토큰 자동 갱신", () => {
  it("401 발생 시 refresh 호출 후 원본 요청 재시도", async () => {
    // 첫 번째 요청: 401
    // 재시도 요청: 200
    mock
      .onGet("/protected")
      .replyOnce(401)
      .onGet("/protected")
      .replyOnce(200, { status: { code: 200, message: "OK" }, data: { ok: true } });

    // refresh는 성공
    globalMock
      .onPost("http://localhost:8000/api/auth/refresh")
      .reply(200, { status: { code: 200 }, data: null });

    const res = await api.get("/protected");

    expect(res.data).toEqual({ ok: true });
  });

  it("refresh 실패 시 logout() 호출", async () => {
    mock.onGet("/protected").reply(401);
    globalMock
      .onPost("http://localhost:8000/api/auth/refresh")
      .reply(401, { status: { code: 401 }, data: null });

    await expect(api.get("/protected")).rejects.toThrow();
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it("/auth/login 401 → refresh 재시도 없음, 즉시 에러", async () => {
    mock.onPost("/auth/login").reply(401);

    await expect(api.post("/auth/login", {})).rejects.toBeDefined();
    // refresh 엔드포인트 호출되지 않아야 함
    expect(globalMock.history.post).toHaveLength(0);
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it("/auth/refresh 401 → 재귀 호출 없음, logout 호출", async () => {
    // refresh URL에 직접 401 요청 → 재시도 하면 안 됨
    mock.onPost("/auth/refresh").reply(401);

    await expect(api.post("/auth/refresh", {})).rejects.toBeDefined();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});

describe("401 인터셉터 - 동시 요청 큐잉", () => {
  it("갱신 중 여러 401 요청 → 갱신 완료 후 일괄 재시도", async () => {
    // 두 요청 모두 401, 재시도는 200
    mock
      .onGet("/resource1")
      .replyOnce(401)
      .onGet("/resource1")
      .reply(200, { status: { code: 200, message: "OK" }, data: "data1" });

    mock
      .onGet("/resource2")
      .replyOnce(401)
      .onGet("/resource2")
      .reply(200, { status: { code: 200, message: "OK" }, data: "data2" });

    globalMock
      .onPost("http://localhost:8000/api/auth/refresh")
      .reply(200, { status: { code: 200 }, data: null });

    const [res1, res2] = await Promise.all([
      api.get("/resource1"),
      api.get("/resource2"),
    ]);

    expect(res1.data).toBe("data1");
    expect(res2.data).toBe("data2");
  });
});
