import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/global/components/ProtectedRoute.tsx";
import { LoginPage } from "@/domain/auth/pages/LoginPage.tsx";
import { OAuth2CallbackPage } from "@/domain/auth/pages/OAuth2CallbackPage.tsx";
import { MyPage } from "@/domain/auth/pages/MyPage.tsx";
import { EditProfilePage } from "@/domain/auth/pages/EditProfilePage.tsx";

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<div className="min-h-screen flex items-center justify-center text-text-primary text-2xl font-bold">Love 6202</div>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

      {/* Protected */}
      <Route path="/me" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/me/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
    </Routes>
  );
}
