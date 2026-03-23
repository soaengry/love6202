import { z } from "zod";

export const loginSchema = z.object({
  code: z.string().min(1),
  deviceId: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
  deviceId: z.string().min(1),
});

export const checkNicknameSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(50, "닉네임은 50자 이하여야 합니다"),
});

export const updateProfileSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(50, "닉네임은 50자 이하여야 합니다")
    .optional(),
  profileImageUrl: z.string().url().max(500).nullable().optional(),
});
