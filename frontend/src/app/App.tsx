import { useEffect, type FC } from "react";
import { AppRouter } from "./routes/AppRouter.tsx";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import { authApi } from "@/domain/auth/api/authApi.ts";

export const App: FC = () => {
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const { data: user } = await authApi.getMe();
        setAuth(user);
      } catch {
        logout();
      }
    };

    // 기존 localStorage 토큰 정리 (마이그레이션)
    localStorage.removeItem("love_access_token");
    localStorage.removeItem("love_refresh_token");

    restoreAuth();
  }, [setAuth, logout]);

  return <AppRouter />;
};
