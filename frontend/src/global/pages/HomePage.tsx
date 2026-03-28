import { useEffect, useState, type FC } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { IoAddCircleOutline } from "react-icons/io5";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import { weddingApi } from "@/domain/wedding/api/weddingApi.ts";
import type { WeddingDetailResponse } from "@/domain/wedding/types.ts";
import type { TabId } from "@/global/components/BottomNav.tsx";
import { InfoTab } from "./tabs/InfoTab.tsx";
import { AccountTab } from "./tabs/AccountTab.tsx";
import { GuestbookTab } from "./tabs/GuestbookTab.tsx";
import { GalleryTab } from "./tabs/GalleryTab.tsx";
import { UploadTab } from "./tabs/UploadTab.tsx";

export const HomePage: FC = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const { activeTab, setActiveTab } = useOutletContext<{ activeTab: TabId; setActiveTab: (tab: TabId) => void }>();
  const { weddingId } = useParams<{ weddingId?: string }>();
  const navigate = useNavigate();

  const [wedding, setWedding] = useState<WeddingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchWedding = async () => {
      setLoading(true);
      try {
        const { data } = weddingId
          ? await weddingApi.getWedding(Number(weddingId))
          : await weddingApi.getLatestWedding();
        setWedding(data);
      } catch {
        // 초대장이 없는 경우 → wedding = null 유지
      } finally {
        setLoading(false);
      }
    };

    fetchWedding();
  }, [isAuthenticated, authLoading, weddingId]);

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 웨딩 데이터 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 웨딩이 없는 경우
  if (!wedding) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto p-6">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-text-primary mb-2">아직 초대장이 없어요</h1>
          <p className="text-text-secondary mb-8">나만의 청첩장을 만들어보세요</p>
          {isAuthenticated && user?.role === "ADMIN" && (
            <button
              onClick={() => navigate("/create")}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors cursor-pointer"
            >
              <IoAddCircleOutline className="text-xl" />
              청첩장 만들기
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // 탭 콘텐츠
  const renderTab = () => {
    switch (activeTab) {
      case "info":
        return <InfoTab data={wedding} />;
      case "account":
        return <AccountTab accounts={wedding.accounts} />;
      case "guestbook":
        return <GuestbookTab weddingId={wedding.wedding.id} setActiveTab={setActiveTab} />;
      case "gallery":
        return <GalleryTab weddingId={wedding.wedding.id} setActiveTab={setActiveTab} />;
      case "upload":
        return <UploadTab weddingId={wedding.wedding.id} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-lg mx-auto p-6"
    >
      {renderTab()}
    </motion.div>
  );
};
