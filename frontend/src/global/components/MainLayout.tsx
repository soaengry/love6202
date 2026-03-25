import { useState, type FC } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav, type TabId } from "./BottomNav.tsx";

export const MainLayout: FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("info");

  return (
    <div className="min-h-screen bg-bg-secondary pb-16">
      <Outlet context={{ activeTab, setActiveTab }} />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};
