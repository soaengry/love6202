import { useEffect, useRef, type FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api, { setCsrfToken } from "@/global/api/axiosInstance.ts";
import { authApi } from "../api/authApi.ts";
import { useAuthStore } from "../store/useAuthStore.ts";
import { getDeviceId } from "../auth.utils.ts";

export const OAuth2CallbackPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get("code");
    if (!code) {
      toast.error("인증 코드가 없습니다.");
      logout();
      navigate("/login", { replace: true });
      return;
    }

    const handleCallback = async () => {
      // App.tsx가 oauth2 경로에서 스킵되므로 여기서 직접 CSRF 발급
      // 응답 body에서 직접 읽어 메모리에 저장 (cross-subdomain cookie 읽기 불가)
      const csrfRes = await api.get<{ csrfToken: string }>("/auth/csrf").catch(() => null);
      if (csrfRes?.data?.csrfToken) setCsrfToken(csrfRes.data.csrfToken);

      try {
        const { data } = await authApi.login(code, getDeviceId());
        setAuth(data.user);
        navigate("/", { replace: true });
      } catch {
        logout();
        toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
        navigate("/", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth, logout]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-text-secondary">로그인 처리 중...</p>
      </div>
    </div>
  );
};
