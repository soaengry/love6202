import api from "@/global/api/axiosInstance.ts";
import type { AuthResponse, UserResponse, UpdateProfileRequest } from "../types.ts";

export const authApi = {
  login(code: string, deviceId: string) {
    return api.post<AuthResponse>("/auth/login", { code, deviceId });
  },

  refresh(refreshToken: string, deviceId: string) {
    return api.post<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      refreshToken,
      deviceId,
    });
  },

  logout(deviceId: string) {
    return api.post("/auth/logout", { deviceId });
  },

  checkNickname(nickname: string) {
    return api.post<{ available: boolean }>("/auth/check-nickname", { nickname });
  },

  getMe() {
    return api.get<UserResponse>("/users/me");
  },

  updateProfile(data: UpdateProfileRequest) {
    return api.patch<UserResponse>("/users/me", data);
  },

  deleteAccount() {
    return api.delete("/users/me");
  },
};
