import type { FC } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/global/components/ProtectedRoute.tsx";
import { MainLayout } from "@/global/components/MainLayout.tsx";
import { HomePage } from "@/global/pages/HomePage.tsx";
import { LoginPage } from "@/domain/auth/pages/LoginPage.tsx";
import { OAuth2CallbackPage } from "@/domain/auth/pages/OAuth2CallbackPage.tsx";
import { MyPage } from "@/domain/auth/pages/MyPage.tsx";
import { EditProfilePage } from "@/domain/auth/pages/EditProfilePage.tsx";
import { WeddingCreatePage } from "@/domain/wedding/pages/WeddingCreatePage.tsx";
import { WeddingEditPage } from "@/domain/wedding/pages/WeddingEditPage.tsx";

export const AppRouter: FC = () => {
  return (
    <Routes>
      {/* Public (no layout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

      {/* Main layout with BottomNav */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/:weddingId" element={<HomePage />} />
        <Route path="/me" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      </Route>

      {/* Protected (no BottomNav) */}
      <Route path="/me/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
      <Route path="/create" element={<ProtectedRoute><WeddingCreatePage /></ProtectedRoute>} />
      <Route path="/edit" element={<ProtectedRoute><WeddingEditPage /></ProtectedRoute>} />
    </Routes>
  );
};
