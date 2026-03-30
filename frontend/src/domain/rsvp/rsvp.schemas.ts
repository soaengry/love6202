import { z } from "zod";
import { RSVP_VALIDATION } from "./rsvp.constants";

export const rsvpFormSchema = z.object({
  attendance: z.enum(["YES", "NO"]),
  name: z.string().min(1, "성함을 입력해주세요").max(50),
  side: z.enum(["BRIDE", "GROOM"]),
  phone: z
    .string()
    .min(1, "연락처를 입력해주세요")
    .regex(/^\d{2,3}-\d{3,4}-\d{4}$/, "올바른 연락처 형식을 입력해주세요 (예: 010-0000-0000)"),
  attendeeCount: z
    .number()
    .int()
    .min(1, "최소 1명 이상이어야 합니다")
    .max(RSVP_VALIDATION.MAX_ATTENDEE_COUNT),
  meal: z.object({
    willEat: z.boolean(),
    mealCount: z.number().int().min(0).max(RSVP_VALIDATION.MAX_MEAL_COUNT),
  }),
  shuttle: z.object({
    willRide: z.boolean(),
    rideCount: z.number().int().min(0).max(RSVP_VALIDATION.MAX_SHUTTLE_COUNT),
  }),
  note: z
    .string()
    .max(RSVP_VALIDATION.NOTE_MAX_LENGTH, `최대 ${RSVP_VALIDATION.NOTE_MAX_LENGTH}자까지 입력 가능합니다`),
  consent: z.literal(true),
});

export type RsvpFormSchema = z.infer<typeof rsvpFormSchema>;
