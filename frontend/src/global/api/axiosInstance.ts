import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { ENV } from "@/global/config/env.ts";
import { getDeviceId } from "@/domain/auth/auth.utils.ts";
import type { ApiResponse } from "@/global/types/index.ts";

const api = axios.create({
  baseURL: ENV.API_BASE_URL + "/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Response: data 추출 + 401 refresh
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: () => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => {
    const apiRes = response.data as ApiResponse<unknown>;
    return { ...response, data: apiRes.data };
  },
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // auth 엔드포인트는 retry 하지 않음
    const url = originalRequest.url || "";
    if (url.includes("/auth/login") || url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: () => {
            originalRequest._retry = true;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
      await axios.post(
        `${ENV.API_BASE_URL}/api/auth/refresh`,
        { deviceId: getDeviceId() },
        { withCredentials: true },
      );
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
