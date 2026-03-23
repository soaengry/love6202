import { create } from "zustand";
import type { UserResponse } from "../types.ts";
import { setTokens, clearTokens, getRefreshToken } from "../auth.utils.ts";

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (tokens: { accessToken: string; refreshToken: string }, user: UserResponse) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (tokens, user) => {
    setTokens(tokens.accessToken, tokens.refreshToken);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setAccessToken: (accessToken) => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      setTokens(accessToken, refreshToken);
    }
    set({ accessToken });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    clearTokens();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
