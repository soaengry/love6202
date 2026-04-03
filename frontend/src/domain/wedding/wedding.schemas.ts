import { z } from "zod";

export const basicInfoSchema = z.object({
  wedding: z.object({
    title: z.string().min(1, "제목을 입력해주세요.").max(255),
    weddingDate: z.string().min(1, "예식 일시를 선택해주세요."),
    venueName: z.string().min(1, "예식장 이름을 입력해주세요.").max(255),
    venueAddress: z.string().min(1, "주소를 입력해주세요.").max(500),
    venueDetail: z.string().max(500).optional().or(z.literal("")),
    venueLat: z.number().nullable(),
    venueLng: z.number().nullable(),
    greeting: z.string().max(1000).optional().or(z.literal("")),
  }),
});

export const coupleSchema = z.object({
  couples: z.array(
    z.object({
      role: z.enum(["GROOM", "BRIDE"]),
      name: z.string().min(1, "이름을 입력해주세요.").max(50),
      email: z.string().email("올바른 이메일을 입력해주세요.").optional().or(z.literal("")),
      contact: z.string().max(50).optional().or(z.literal("")),
      fatherName: z.string().max(50).optional().or(z.literal("")),
      isFatherAlive: z.boolean(),
      motherName: z.string().max(50).optional().or(z.literal("")),
      isMotherAlive: z.boolean(),
    }),
  ).min(1),
});

export const scheduleSchema = z.object({
  schedules: z.array(
    z.object({
      title: z.string().min(1, "식순 제목을 입력해주세요.").max(255),
      description: z.string().optional().or(z.literal("")),
      orderIndex: z.number(),
    }),
  ),
});

export const accountSchema = z.object({
  accounts: z.array(
    z.object({
      side: z.enum(["GROOM", "GROOM_FAMILY", "BRIDE", "BRIDE_FAMILY"]),
      bankName: z.string().optional().or(z.literal("")),
      bankCode: z.string().optional().or(z.literal("")),
      accountNumber: z.string().optional().or(z.literal("")),
      accountHolder: z.string().optional().or(z.literal("")),
      kakaoPayUrl: z.string().optional().or(z.literal("")),
      tossNumber: z.string().optional().or(z.literal("")),
      orderIndex: z.number(),
      paymentType: z.enum(["BANK", "KAKAOPAY", "TOSS"]),
    }).superRefine((data, ctx) => {
      if (!data.accountHolder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "받는 분을 입력해주세요.",
          path: ["accountHolder"],
        });
      }
      if (data.paymentType === "BANK") {
        if (!data.accountNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "계좌번호를 입력해주세요.", path: ["accountNumber"] });
        }
        if (!data.bankName) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "은행명을 입력해주세요.", path: ["bankName"] });
        }
      } else if (data.paymentType === "KAKAOPAY") {
        if (!data.kakaoPayUrl) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "카카오페이 송금 URL을 입력해주세요.", path: ["kakaoPayUrl"] });
        }
      } else if (data.paymentType === "TOSS") {
        if (!data.tossNumber) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "토스 ID를 입력해주세요.", path: ["tossNumber"] });
        }
      }
    }),
  ),
});

export const extraInfoSchema = z.object({
  wedding: z.object({
    dressCode: z.string().optional().or(z.literal("")),
    notice: z.string().optional().or(z.literal("")),
    parkingInfo: z.string().optional().or(z.literal("")),
    mealInfo: z.string().optional().or(z.literal("")),
  }),
  transportations: z.array(
    z.object({
      type: z.enum(["SUBWAY", "BUS", "SHUTTLE"]),
      title: z.string().min(1, "교통편 제목을 입력해주세요."),
      description: z.string().optional().or(z.literal("")),
      orderIndex: z.number(),
    }),
  ),
  announcements: z.array(
    z.object({
      title: z.string().min(1, "공지사항 제목을 입력해주세요."),
      content: z.string().min(1, "공지사항 내용을 입력해주세요."),
      isPinned: z.boolean(),
    }),
  ),
});

// 스텝별 필드 이름 (trigger 용)
export const STEP_FIELDS = [
  ["wedding.title", "wedding.weddingDate", "wedding.venueName", "wedding.venueAddress", "wedding.venueDetail", "wedding.venueLat", "wedding.venueLng", "wedding.greeting"],
  ["couples"],
  ["schedules"],
  ["accounts"],
  ["wedding.dressCode", "wedding.notice", "wedding.parkingInfo", "wedding.mealInfo", "transportations", "announcements"],
] as const;
