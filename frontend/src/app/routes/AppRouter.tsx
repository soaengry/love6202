import { lazy, Suspense, type FC } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/global/components/ProtectedRoute.tsx";
import { MainLayout } from "@/global/components/MainLayout.tsx";
import { HomePage } from "@/global/pages/HomePage.tsx";
import { LoginPage } from "@/domain/auth/pages/LoginPage.tsx";
import { OAuth2CallbackPage } from "@/domain/auth/pages/OAuth2CallbackPage.tsx";

// 인증 사용자만 접근하는 페이지는 lazy 로드로 초기 번들에서 제외
const MyPage = lazy(() =>
  import("@/domain/auth/pages/MyPage.tsx").then((m) => ({ default: m.MyPage })),
);
const EditProfilePage = lazy(() =>
  import("@/domain/auth/pages/EditProfilePage.tsx").then((m) => ({ default: m.EditProfilePage })),
);
const WeddingCreatePage = lazy(() =>
  import("@/domain/wedding/pages/WeddingCreatePage.tsx").then((m) => ({ default: m.WeddingCreatePage })),
);
const WeddingEditPage = lazy(() =>
  import("@/domain/wedding/pages/WeddingEditPage.tsx").then((m) => ({ default: m.WeddingEditPage })),
);

const PageSpinner: FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

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
        <Route path="/me" element={
          <ProtectedRoute>
            <Suspense fallback={<PageSpinner />}>
              <MyPage />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>

      {/* Protected (no BottomNav) */}
      <Route path="/me/edit" element={
        <ProtectedRoute>
          <Suspense fallback={<PageSpinner />}>
            <EditProfilePage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/create" element={
        <ProtectedRoute>
          <Suspense fallback={<PageSpinner />}>
            <WeddingCreatePage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/edit" element={
        <ProtectedRoute>
          <Suspense fallback={<PageSpinner />}>
            <WeddingEditPage />
          </Suspense>
        </ProtectedRoute>
      } />
    </Routes>
  );
};
