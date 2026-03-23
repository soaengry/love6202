import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { ENV } from "@/global/config/env.ts";

export function LoginPage() {
  const handleGoogleLogin = () => {
    const params = new URLSearchParams({
      client_id: ENV.GOOGLE_CLIENT_ID,
      redirect_uri: ENV.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-bg-primary rounded-2xl shadow-lg p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Love 6202
          </h1>
          <p className="text-text-secondary">소중한 순간을 함께</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-xl bg-bg-primary hover:bg-bg-secondary transition-colors text-text-primary font-medium cursor-pointer"
        >
          <FcGoogle className="text-xl" />
          Google로 로그인
        </button>
      </motion.div>
    </div>
  );
}
