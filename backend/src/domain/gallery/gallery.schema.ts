import { z } from "zod";

export const galleryQuerySchema = z.object({
  weddingId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(500).default(10),
});

export const galleryDeleteBodySchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1).max(50),
});
