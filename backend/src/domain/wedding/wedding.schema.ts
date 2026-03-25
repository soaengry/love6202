import { z } from "zod";

const coupleSchema = z.object({
  role: z.enum(["GROOM", "BRIDE"]),
  name: z.string().min(1).max(50),
  email: z.string().email().max(255).optional().or(z.literal("")),
  contact: z.string().max(50).optional().or(z.literal("")),
  fatherName: z.string().max(50).optional().or(z.literal("")),
  isFatherAlive: z.boolean().default(true),
  motherName: z.string().max(50).optional().or(z.literal("")),
  isMotherAlive: z.boolean().default(true),
});

const accountSchema = z.object({
  side: z.enum(["GROOM", "GROOM_FAMILY", "BRIDE", "BRIDE_FAMILY"]),
  bankName: z.string().min(1).max(100),
  bankCode: z.string().min(1).max(10),
  accountNumber: z.string().min(1).max(50),
  accountHolder: z.string().min(1).max(50),
  kakaoPayUrl: z.string().url().max(500).optional().or(z.literal("")),
  tossNumber: z.string().max(50).optional().or(z.literal("")),
  orderIndex: z.number().int().min(0),
});

const scheduleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional().or(z.literal("")),
  orderIndex: z.number().int().min(0),
});

const transportationSchema = z.object({
  type: z.enum(["SUBWAY", "BUS", "SHUTTLE"]),
  title: z.string().min(1).max(255),
  description: z.string().optional().or(z.literal("")),
  orderIndex: z.number().int().min(0),
});

const announcementSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  isPinned: z.boolean().default(false),
});

export const createWeddingBodySchema = z.object({
  wedding: z.object({
    title: z.string().min(1).max(255),
    weddingDate: z.string().datetime(),
    venueName: z.string().min(1).max(255),
    venueAddress: z.string().min(1).max(500),
    venueDetail: z.string().max(500).optional().or(z.literal("")),
    dressCode: z.string().max(255).optional().or(z.literal("")),
    notice: z.string().optional().or(z.literal("")),
    parkingInfo: z.string().optional().or(z.literal("")),
    mealInfo: z.string().optional().or(z.literal("")),
  }),
  couples: z.array(coupleSchema).min(1).max(2),
  accounts: z.array(accountSchema).default([]),
  schedules: z.array(scheduleSchema).default([]),
  transportations: z.array(transportationSchema).default([]),
  announcements: z.array(announcementSchema).default([]),
});

export type CreateWeddingBody = z.infer<typeof createWeddingBodySchema>;

export const updateWeddingBodySchema = createWeddingBodySchema;
export type UpdateWeddingBody = z.infer<typeof updateWeddingBodySchema>;

export const weddingIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
