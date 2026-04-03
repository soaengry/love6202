import { z } from "zod";

// ─── Query ────────────────────────────────────────────────

export const rsvpQuerySchema = z.object({
  weddingId: z.coerce.number().int().positive(),
});

export const rsvpListQuerySchema = z.object({
  weddingId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
});

export const rsvpParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ─── Body ─────────────────────────────────────────────────

const mealSchema = z.object({
  willEat: z.boolean(),
  mealCount: z.number().int().min(0).max(99),
});

const shuttleSchema = z.object({
  willRide: z.boolean(),
  rideCount: z.number().int().min(0).max(99),
});

export const rsvpCreateSchema = z.object({
  weddingId: z.number().int().positive(),
  attendance: z.enum(["YES", "NO"]),
  name: z.string().min(1).max(50),
  side: z.enum(["BRIDE", "GROOM"]),
  phone: z.string().min(1).max(20),
  attendeeCount: z.number().int().min(1).max(99),
  meal: mealSchema,
  shuttle: shuttleSchema,
  note: z.string().max(50).optional().default(""),
  consent: z.literal(true),
});

export const rsvpUpdateSchema = z.object({
  attendance: z.enum(["YES", "NO"]),
  name: z.string().min(1).max(50),
  side: z.enum(["BRIDE", "GROOM"]),
  phone: z.string().min(1).max(20),
  attendeeCount: z.number().int().min(1).max(99),
  meal: mealSchema,
  shuttle: shuttleSchema,
  note: z.string().max(50).optional().default(""),
});
