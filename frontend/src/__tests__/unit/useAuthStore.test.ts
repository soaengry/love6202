import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/domain/auth/store/useAuthStore";
import type { UserResponse } from "@/domain/auth/types";

const mockUser: UserResponse = {
  id: 1,
  email: "test@example.com",
  nickname: "테스터",
  profileImageUrl: "https://example.com/pic.jpg",
  role: "GUEST",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockHostUser: UserResponse = {
  ...mockUser,
  id: 2,
  role: "HOST",
};

beforeEach(() => {
  // 각 테스트 전 스토어 초기 상태로 리셋
  useAuthStore.setState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
});

describe("useAuthStore 초기 상태", () => {
  it("user는 null이다", () => {
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("isAuthenticated는 false다", () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("isLoading은 true다", () => {
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});

describe("setAuth", () => {
  it("user를 설정하고, isAuthenticated=true, isLoading=false로 바꾼다", () => {
    useAuthStore.getState().setAuth(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it("다른 user로 교체할 수 있다", () => {
    useAuthStore.getState().setAuth(mockUser);
    useAuthStore.getState().setAuth(mockHostUser);

    expect(useAuthStore.getState().user?.id).toBe(2);
    expect(useAuthStore.getState().user?.role).toBe("HOST");
  });
});

describe("setUser", () => {
  it("user만 업데이트하고 isAuthenticated는 유지된다", () => {
    useAuthStore.getState().setAuth(mockUser);
    const updatedUser = { ...mockUser, nickname: "업데이트됨" };

    useAuthStore.getState().setUser(updatedUser);

    const state = useAuthStore.getState();
    expect(state.user?.nickname).toBe("업데이트됨");
    expect(state.isAuthenticated).toBe(true); // 유지
    expect(state.isLoading).toBe(false); // 유지
  });
});

describe("logout", () => {
  it("user를 null로, isAuthenticated=false, isLoading=false로 초기화한다", () => {
    useAuthStore.getState().setAuth(mockUser);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it("로그인 안 된 상태에서 logout() 호출 → 안전하게 동작한다", () => {
    expect(() => useAuthStore.getState().logout()).not.toThrow();
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe("setLoading", () => {
  it("isLoading을 true로 설정한다", () => {
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().setLoading(true);

    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it("isLoading을 false로 설정한다", () => {
    useAuthStore.getState().setLoading(false);

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("setLoading은 user/isAuthenticated에 영향을 주지 않는다", () => {
    useAuthStore.getState().setAuth(mockUser);
    useAuthStore.getState().setLoading(true);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });
});
