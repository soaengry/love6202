import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { IoArrowBack } from "react-icons/io5";
import { toast } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore.ts";
import { authApi } from "../api/authApi.ts";

const editProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(50, "닉네임은 50자 이하여야 합니다"),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

export function EditProfilePage() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      nickname: user?.nickname ?? "",
    },
  });

  const checkNickname = async (nickname: string) => {
    if (!nickname || nickname === user?.nickname) {
      setNicknameStatus("idle");
      return;
    }
    if (nickname.length < 2) return;

    setNicknameStatus("checking");
    try {
      const { data } = await authApi.checkNickname(nickname);
      setNicknameStatus(data.available ? "available" : "taken");
    } catch {
      setNicknameStatus("idle");
    }
  };

  const onSubmit = async (data: EditProfileForm) => {
    if (data.nickname === user?.nickname) {
      navigate("/me");
      return;
    }
    if (nicknameStatus === "taken") {
      toast.error("이미 사용 중인 닉네임입니다.");
      return;
    }

    try {
      const { data: updatedUser } = await authApi.updateProfile({ nickname: data.nickname });
      setUser(updatedUser);
      toast.success("프로필이 수정되었습니다.");
      navigate("/me");
    } catch {
      toast.error("프로필 수정에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto p-6"
      >
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/me")}
            className="p-2 hover:bg-bg-primary rounded-full transition-colors cursor-pointer"
          >
            <IoArrowBack className="text-xl text-text-primary" />
          </button>
          <h1 className="text-xl font-semibold text-text-primary">프로필 수정</h1>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-bg-primary rounded-2xl shadow-sm p-6">
          <div className="mb-6">
            <label htmlFor="nickname" className="block text-sm font-medium text-text-primary mb-2">
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              {...register("nickname", {
                onBlur: (e) => checkNickname(e.target.value),
              })}
              className="w-full px-4 py-3 border border-border rounded-xl bg-bg-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              placeholder="닉네임을 입력하세요"
            />
            {errors.nickname && (
              <p className="mt-1 text-sm text-red-500">{errors.nickname.message}</p>
            )}
            {nicknameStatus === "checking" && (
              <p className="mt-1 text-sm text-text-secondary">확인 중...</p>
            )}
            {nicknameStatus === "available" && (
              <p className="mt-1 text-sm text-primary">사용 가능한 닉네임입니다.</p>
            )}
            {nicknameStatus === "taken" && (
              <p className="mt-1 text-sm text-red-500">이미 사용 중인 닉네임입니다.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || nicknameStatus === "taken"}
            className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
