import { describe, it, expect } from "vitest";
import {
  basicInfoSchema,
  coupleSchema,
  scheduleSchema,
  accountSchema,
  extraInfoSchema,
  STEP_FIELDS,
} from "@/domain/wedding/wedding.schemas";

// ── basicInfoSchema ──────────────────────────────────────
describe("basicInfoSchema", () => {
  const validBasicInfo = {
    wedding: {
      title: "우리의 결혼식",
      weddingDate: "2024-06-15T11:00",
      venueName: "서울웨딩홀",
      venueAddress: "서울시 강남구 테헤란로 1",
      venueDetail: "3층 그랜드홀",
      venueLat: 37.5,
      venueLng: 127.1,
      greeting: "많은 참석 부탁드립니다.",
    },
  };

  it("유효한 데이터 → 파싱 성공", () => {
    expect(() => basicInfoSchema.parse(validBasicInfo)).not.toThrow();
  });

  it("title 공백 → 실패", () => {
    const result = basicInfoSchema.safeParse({
      wedding: { ...validBasicInfo.wedding, title: "" },
    });
    expect(result.success).toBe(false);
  });

  it("title 256자 → 실패 (max 255)", () => {
    const result = basicInfoSchema.safeParse({
      wedding: { ...validBasicInfo.wedding, title: "a".repeat(256) },
    });
    expect(result.success).toBe(false);
  });

  it("weddingDate 누락 → 실패", () => {
    const { weddingDate: _, ...rest } = validBasicInfo.wedding;
    const result = basicInfoSchema.safeParse({ wedding: rest });
    expect(result.success).toBe(false);
  });

  it("venueAddress 501자 → 실패 (max 500)", () => {
    const result = basicInfoSchema.safeParse({
      wedding: { ...validBasicInfo.wedding, venueAddress: "a".repeat(501) },
    });
    expect(result.success).toBe(false);
  });

  it("venueLat null 허용", () => {
    const result = basicInfoSchema.safeParse({
      wedding: { ...validBasicInfo.wedding, venueLat: null, venueLng: null },
    });
    expect(result.success).toBe(true);
  });

  it("선택적 필드 없어도 성공", () => {
    const minimal = {
      wedding: {
        title: "결혼식",
        weddingDate: "2024-06-15",
        venueName: "홀",
        venueAddress: "주소",
        venueLat: null,
        venueLng: null,
      },
    };
    expect(() => basicInfoSchema.parse(minimal)).not.toThrow();
  });
});

// ── coupleSchema ─────────────────────────────────────────
describe("coupleSchema", () => {
  const validCouple = {
    couples: [
      {
        role: "GROOM",
        name: "신랑",
        email: "groom@example.com",
        contact: "010-1234-5678",
        fatherName: "아버지",
        isFatherAlive: true,
        motherName: "어머니",
        isMotherAlive: true,
      },
    ],
  };

  it("유효한 GROOM 커플 데이터 → 성공", () => {
    expect(() => coupleSchema.parse(validCouple)).not.toThrow();
  });

  it("name 공백 → 실패", () => {
    const result = coupleSchema.safeParse({
      couples: [{ ...validCouple.couples[0], name: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("name 51자 → 실패 (max 50)", () => {
    const result = coupleSchema.safeParse({
      couples: [{ ...validCouple.couples[0], name: "a".repeat(51) }],
    });
    expect(result.success).toBe(false);
  });

  it("잘못된 email 형식 → 실패", () => {
    const result = coupleSchema.safeParse({
      couples: [{ ...validCouple.couples[0], email: "not-an-email" }],
    });
    expect(result.success).toBe(false);
  });

  it("email 빈 문자열 → 허용 (선택 필드)", () => {
    const result = coupleSchema.safeParse({
      couples: [{ ...validCouple.couples[0], email: "" }],
    });
    expect(result.success).toBe(true);
  });

  it("couples 빈 배열 → 실패 (min 1)", () => {
    const result = coupleSchema.safeParse({ couples: [] });
    expect(result.success).toBe(false);
  });

  it("role이 GROOM/BRIDE가 아님 → 실패", () => {
    const result = coupleSchema.safeParse({
      couples: [{ ...validCouple.couples[0], role: "INVALID" }],
    });
    expect(result.success).toBe(false);
  });
});

// ── scheduleSchema ───────────────────────────────────────
describe("scheduleSchema", () => {
  it("유효한 식순 → 성공", () => {
    expect(() =>
      scheduleSchema.parse({
        schedules: [{ title: "입장", description: "신랑 입장", orderIndex: 0 }],
      }),
    ).not.toThrow();
  });

  it("schedules 빈 배열 → 성공 (필수 아님)", () => {
    expect(() => scheduleSchema.parse({ schedules: [] })).not.toThrow();
  });

  it("title 공백 → 실패", () => {
    const result = scheduleSchema.safeParse({
      schedules: [{ title: "", orderIndex: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

// ── accountSchema ────────────────────────────────────────
describe("accountSchema", () => {
  const bankAccount = {
    side: "GROOM",
    paymentType: "BANK",
    bankName: "국민은행",
    bankCode: "KB",
    accountNumber: "123-456-789",
    accountHolder: "홍길동",
    kakaoPayUrl: "",
    tossNumber: "",
    orderIndex: 0,
  };

  it("BANK 타입: 유효한 데이터 → 성공", () => {
    expect(() =>
      accountSchema.parse({ accounts: [bankAccount] }),
    ).not.toThrow();
  });

  it("BANK 타입: accountNumber 없음 → 실패", () => {
    const result = accountSchema.safeParse({
      accounts: [{ ...bankAccount, accountNumber: "" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("계좌번호를 입력해주세요.");
    }
  });

  it("BANK 타입: bankName 없음 → 실패", () => {
    const result = accountSchema.safeParse({
      accounts: [{ ...bankAccount, bankName: "" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("은행명을 입력해주세요.");
    }
  });

  it("KAKAOPAY 타입: kakaoPayUrl 있음 → 성공", () => {
    const kakaoAccount = {
      ...bankAccount,
      paymentType: "KAKAOPAY",
      kakaoPayUrl: "https://qr.kakaopay.com/test",
    };
    expect(() =>
      accountSchema.parse({ accounts: [kakaoAccount] }),
    ).not.toThrow();
  });

  it("KAKAOPAY 타입: kakaoPayUrl 없음 → 실패", () => {
    const result = accountSchema.safeParse({
      accounts: [{ ...bankAccount, paymentType: "KAKAOPAY", kakaoPayUrl: "" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("카카오페이 송금 URL을 입력해주세요.");
    }
  });

  it("TOSS 타입: tossNumber 있음 → 성공", () => {
    const tossAccount = {
      ...bankAccount,
      paymentType: "TOSS",
      tossNumber: "toss_groom",
    };
    expect(() =>
      accountSchema.parse({ accounts: [tossAccount] }),
    ).not.toThrow();
  });

  it("TOSS 타입: tossNumber 없음 → 실패", () => {
    const result = accountSchema.safeParse({
      accounts: [{ ...bankAccount, paymentType: "TOSS", tossNumber: "" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("토스 ID를 입력해주세요.");
    }
  });

  it("accountHolder 없음 → 실패 (모든 타입)", () => {
    const result = accountSchema.safeParse({
      accounts: [{ ...bankAccount, accountHolder: "" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("받는 분을 입력해주세요.");
    }
  });

  it("side가 유효하지 않은 값 → 실패", () => {
    const result = accountSchema.safeParse({
      accounts: [{ ...bankAccount, side: "INVALID" }],
    });
    expect(result.success).toBe(false);
  });
});

// ── STEP_FIELDS ──────────────────────────────────────────
describe("STEP_FIELDS", () => {
  it("5개 스텝이 정의되어 있다", () => {
    expect(STEP_FIELDS).toHaveLength(5);
  });

  it("Step 0에 wedding 기본 정보 필드가 포함된다", () => {
    expect(STEP_FIELDS[0]).toContain("wedding.title");
    expect(STEP_FIELDS[0]).toContain("wedding.weddingDate");
    expect(STEP_FIELDS[0]).toContain("wedding.venueAddress");
  });

  it("Step 1에 couples 필드가 포함된다", () => {
    expect(STEP_FIELDS[1]).toContain("couples");
  });

  it("Step 2에 schedules 필드가 포함된다", () => {
    expect(STEP_FIELDS[2]).toContain("schedules");
  });

  it("Step 3에 accounts 필드가 포함된다", () => {
    expect(STEP_FIELDS[3]).toContain("accounts");
  });
});
