import { useEffect, type FC } from "react";
import { AppRouter } from "./routes/AppRouter.tsx";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import { authApi } from "@/domain/auth/api/authApi.ts";
import { getAccessToken, getRefreshToken, isTokenExpired } from "@/domain/auth/auth.utils.ts";

export const App: FC = () => {
  const { setAuth, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const restoreAuth = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      // 둘 다 만료면 로그아웃
      if (isTokenExpired(accessToken) && isTokenExpired(refreshToken)) {
        logout();
        return;
      }

      try {
        const { data: user } = await authApi.getMe();
        setAuth({ accessToken, refreshToken }, user);
      } catch {
        logout();
      }
    };

    restoreAuth();
  }, [setAuth, logout, setLoading]);

  return <AppRouter />;
};
