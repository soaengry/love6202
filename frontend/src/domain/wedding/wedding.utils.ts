import type { AccountFormData, WeddingFormData, WeddingDetailResponse } from "./types.ts";

// ISO 날짜 문자열을 datetime-local 입력값 형식(YYYY-MM-DDTHH:mm)으로 변환
export function formatDateToLocal(isoDate: string): string {
  const d = new Date(isoDate);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

// 계좌 목록을 서버 전송용으로 정규화
// paymentType UI 필드 제거, 결제수단별 bankName/bankCode 표준화, orderIndex 재정렬
export function normalizeAccountsForSubmit(accounts: AccountFormData[]) {
  return accounts.map((a, i) => {
    const { paymentType, ...rest } = a;
    if (paymentType === "KAKAOPAY") {
      return { ...rest, bankName: "카카오페이", bankCode: "KAKAOPAY", orderIndex: i };
    }
    if (paymentType === "TOSS") {
      return {
        ...rest,
        bankName: "토스",
        bankCode: "TOSS",
        accountNumber: rest.tossNumber || rest.accountNumber,
        orderIndex: i,
      };
    }
    return { ...rest, orderIndex: i };
  });
}

// WeddingDetailResponse → WeddingFormData (EditPage 초기값 변환)
export function toWeddingFormData(res: WeddingDetailResponse): WeddingFormData {
  const w = res.wedding;
  return {
    wedding: {
      title: w.title,
      weddingDate: w.weddingDate ? formatDateToLocal(w.weddingDate) : "",
      venueName: w.venueName,
      venueAddress: w.venueAddress,
      venueDetail: w.venueDetail ?? "",
      venueLat: w.venueLat,
      venueLng: w.venueLng,
      dressCode: w.dressCode ?? "",
      notice: w.notice ?? "",
      parkingInfo: w.parkingInfo ?? "",
      mealInfo: w.mealInfo ?? "",
      greeting: w.greeting ?? "",
    },
    couples: res.couples.map((c) => ({
      role: c.role,
      name: c.name,
      email: c.email ?? "",
      contact: c.contact ?? "",
      fatherName: c.fatherName ?? "",
      isFatherAlive: c.isFatherAlive,
      motherName: c.motherName ?? "",
      isMotherAlive: c.isMotherAlive,
    })),
    accounts: res.accounts.map((a) => ({
      side: a.side,
      bankName: a.bankName ?? "",
      bankCode: a.bankCode ?? "",
      accountNumber: a.accountNumber ?? "",
      accountHolder: a.accountHolder,
      kakaoPayUrl: a.kakaoPayUrl ?? "",
      tossNumber: a.tossNumber ?? "",
      orderIndex: a.orderIndex,
      paymentType:
        a.bankCode === "KAKAOPAY" ? "KAKAOPAY"
        : a.bankCode === "TOSS" ? "TOSS"
        : "BANK",
    })),
    schedules: res.schedules.map((s) => ({
      title: s.title,
      description: s.description ?? "",
      orderIndex: s.orderIndex,
    })),
    transportations: res.transportations.map((t) => ({
      type: t.type,
      title: t.title,
      description: t.description ?? "",
      orderIndex: t.orderIndex,
    })),
    announcements: res.announcements.map((a) => ({
      title: a.title,
      content: a.content,
      isPinned: a.isPinned,
    })),
  };
}

// WeddingFormData를 서버 전송용 submitData로 변환 (공통)
export function buildSubmitData(
  data: WeddingFormData,
  extra: Record<string, unknown> = {},
) {
  return {
    ...data,
    ...extra,
    wedding: {
      ...data.wedding,
      weddingDate: new Date(data.wedding.weddingDate).toISOString(),
    },
    schedules: data.schedules.map((s, i) => ({ ...s, orderIndex: i })),
    accounts: normalizeAccountsForSubmit(data.accounts),
    transportations: data.transportations.map((t, i) => ({ ...t, orderIndex: i })),
  };
}
