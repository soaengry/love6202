import { z } from "zod";

export const MAX_UPLOAD_COUNT = 20;
export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const uploadQuerySchema = z.object({
  weddingId: z.coerce.number().int().positive(),
});

export const uploadDeleteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const presignBodySchema = z.object({
  files: z
    .array(
      z.object({
        contentType: z.enum(ALLOWED_UPLOAD_TYPES),
        size: z.number().int().positive().max(MAX_UPLOAD_FILE_SIZE),
      }),
    )
    .min(1)
    .max(MAX_UPLOAD_COUNT),
});

export const completeBodySchema = z.object({
  keys: z
    .array(z.string().regex(/^user-uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/))
    .min(1)
    .max(MAX_UPLOAD_COUNT),
});
