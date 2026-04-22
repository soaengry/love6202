import React, { useEffect, useState, type FC } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";
import { EmptyWeddingState } from "@/global/components/EmptyWeddingState.tsx";
import { weddingApi } from "@/domain/wedding/api/weddingApi.ts";
import type { WeddingDetailResponse } from "@/domain/wedding/types.ts";
import type { TabId } from "@/global/components/BottomNav.tsx";
import { InfoTab } from "./tabs/InfoTab.tsx";
import { RsvpTab } from "./tabs/RsvpTab.tsx";
import { GuestbookTab } from "./tabs/GuestbookTab.tsx";
import { GalleryTab } from "./tabs/GalleryTab.tsx";
import { UploadTab } from "./tabs/UploadTab.tsx";

export const HomePage: FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { activeTab, setActiveTab } = useOutletContext<{ activeTab: TabId; setActiveTab: (tab: TabId) => void }>();
  const { weddingId: weddingIdParam } = useParams<{ weddingId?: string }>();

  const [wedding, setWedding] = useState<WeddingDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchWedding = async () => {
      setLoading(true);
      try {
        const parsedId = weddingIdParam ? Number(weddingIdParam) : NaN;
        const { data } = !isNaN(parsedId)
          ? await weddingApi.getWedding(parsedId)
          : await weddingApi.getLatestWedding();
        setWedding(data);
      } catch {
        // 초대장이 없는 경우 → wedding = null 유지
      } finally {
        setLoading(false);
      }
    };

    fetchWedding();
  }, [isAuthenticated, authLoading, weddingIdParam]);

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

  if (!wedding) return <EmptyWeddingState />;

  const weddingId = wedding.wedding.id;
  const tabContent: Record<TabId, React.ReactNode> = {
    info:      <InfoTab data={wedding} />,
    rsvp:      <RsvpTab weddingId={weddingId} />,
    guestbook: <GuestbookTab weddingId={weddingId} setActiveTab={setActiveTab} />,
    gallery:   <GalleryTab weddingId={weddingId} setActiveTab={setActiveTab} />,
    upload:    <UploadTab weddingId={weddingId} setActiveTab={setActiveTab} />,
  };

  return (
    <motion.div
      key={activeTab}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-lg mx-auto p-6"
    >
      {tabContent[activeTab]}
    </motion.div>
  );
};
