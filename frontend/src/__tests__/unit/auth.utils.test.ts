import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// localStorage 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "mocked-uuid-1234-5678-abcd"),
});

const { getDeviceId } = await import("@/domain/auth/auth.utils");

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

describe("getDeviceId", () => {
  it("localStorage에 없으면 UUID를 생성하고 저장한다", () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    const id = getDeviceId();

    expect(id).toBe("mocked-uuid-1234-5678-abcd");
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "love_device_id",
      "mocked-uuid-1234-5678-abcd",
    );
  });

  it("localStorage에 이미 있으면 기존 값을 반환한다", () => {
    localStorageMock.getItem.mockReturnValueOnce("existing-device-id");

    const id = getDeviceId();

    expect(id).toBe("existing-device-id");
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  });

  it("두 번 호출 시 두 번째는 저장된 값을 반환한다", () => {
    // 첫 번째: null → 생성 후 저장
    localStorageMock.getItem.mockReturnValueOnce(null);
    const first = getDeviceId();

    // 두 번째: 저장된 값 반환
    localStorageMock.getItem.mockReturnValueOnce("mocked-uuid-1234-5678-abcd");
    const second = getDeviceId();

    expect(first).toBe(second);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
  });
});
