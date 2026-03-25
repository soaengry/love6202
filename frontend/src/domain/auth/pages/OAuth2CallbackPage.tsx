import { useEffect, useRef, type FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { authApi } from "../api/authApi.ts";
import { useAuthStore } from "../store/useAuthStore.ts";
import { getDeviceId } from "../auth.utils.ts";

export const OAuth2CallbackPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get("code");
    if (!code) {
      toast.error("인증 코드가 없습니다.");
      navigate("/login", { replace: true });
      return;
    }

    const handleCallback = async () => {
      try {
        const { data } = await authApi.login(code, getDeviceId());
        setAuth(data.user);
        navigate("/", { replace: true });
      } catch {
        toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
        navigate("/login", { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-text-secondary">로그인 처리 중...</p>
      </div>
    </div>
  );
};
