import { z } from "zod";

const VALID_TYPES = [
  "post_01", "post_02", "post_03", "post_04", "post_05",
  "post_06", "post_07", "post_08", "post_09", "post_10",
] as const;

export const guestbookQuerySchema = z.object({
  weddingId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(50).default(10),
});

export const guestbookCreateSchema = z.object({
  weddingId: z.number().int().positive(),
  name: z.string().min(1).max(50),
  content: z.string().min(1).max(200),
  type: z.enum(VALID_TYPES),
});

export const guestbookDeleteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
