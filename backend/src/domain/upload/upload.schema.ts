import { z } from "zod";

export const uploadQuerySchema = z.object({
  weddingId: z.coerce.number().int().positive(),
});

export const uploadDeleteParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
