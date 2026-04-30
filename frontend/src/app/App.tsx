import { useEffect, type FC } from "react";
import { AppRouter } from "./routes/AppRouter.tsx";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import { authApi } from "@/domain/auth/api/authApi.ts";
import api, { setCsrfToken } from "@/global/api/axiosInstance.ts";

export const App: FC = () => {
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    // OAuth2 콜백은 콜백 핸들러가 직접 CSRF + 로그인을 처리하므로 스킵
    if (window.location.pathname.startsWith("/oauth2/")) return;

    const restoreAuth = async () => {
      // CSRF 토큰 발급 — 응답 body에서 직접 읽어 메모리에 저장
      try {
        const { data } = await api.get<{ csrfToken: string }>("/auth/csrf");
        if (data?.csrfToken) setCsrfToken(data.csrfToken);
      } catch {
        // CSRF 실패해도 앱 진행
      }

      // 기존 localStorage 토큰 정리 (마이그레이션)
      localStorage.removeItem("love_access_token");
      localStorage.removeItem("love_refresh_token");

      try {
        const { data: user } = await authApi.getMe();
        setAuth(user);
      } catch {
        logout();
      }
    };

    restoreAuth();
  }, [setAuth, logout]);

  return <AppRouter />;
};
