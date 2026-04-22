import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { IoAddCircleOutline } from "react-icons/io5";
import { useAuthStore } from "@/domain/auth/store/useAuthStore.ts";

export const EmptyWeddingState: FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const canCreate = isAuthenticated && user?.role === "ADMIN";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto p-6">
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-text-primary mb-2">아직 초대장이 없어요</h1>
        <p className="text-text-secondary mb-8">나만의 청첩장을 만들어보세요</p>
        {canCreate && (
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
};
