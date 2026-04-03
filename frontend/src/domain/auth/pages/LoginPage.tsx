import { useEffect, type FC } from "react";
import { ENV } from "@/global/config/env.ts";

export const LoginPage: FC = () => {
  useEffect(() => {
    const params = new URLSearchParams({
      client_id: ENV.GOOGLE_CLIENT_ID,
      redirect_uri: ENV.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }, []);

  return (
    <div className="login-page min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-text-secondary">로그인 페이지로 이동 중...</p>
      </div>
    </div>
  );
};
