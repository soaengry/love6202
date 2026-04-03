import api from "@/global/api/axiosInstance.ts";
import type { AuthResponse, UserResponse } from "../types.ts";
import { AUTH_API, USER_API } from "../auth.constants.ts";

export const authApi = {
  login(code: string, deviceId: string) {
    return api.post<AuthResponse>(AUTH_API.LOGIN, { code, deviceId });
  },

  refresh(deviceId: string) {
    return api.post(AUTH_API.REFRESH, { deviceId });
  },

  logout(deviceId: string) {
    return api.post(AUTH_API.LOGOUT, { deviceId });
  },

  checkNickname(nickname: string) {
    return api.post<{ available: boolean }>(AUTH_API.CHECK_NICKNAME, {
      nickname,
    });
  },

  getMe() {
    return api.get<UserResponse>(USER_API.ME);
  },

  updateProfile(formData: FormData) {
    return api.patch<UserResponse>(USER_API.ME, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteAccount() {
    return api.delete(USER_API.ME);
  },
};
