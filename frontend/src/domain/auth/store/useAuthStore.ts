import { create } from "zustand";
import type { UserResponse } from "../types.ts";

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: UserResponse) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user) => {
    set({ user, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
