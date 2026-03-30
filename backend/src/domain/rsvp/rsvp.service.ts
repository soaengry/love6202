import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import { paginate } from "@/util/pagination";
import { RsvpErrorCode } from "./rsvp.error";
import { toRsvpResponse, type RsvpListResponse, type RsvpResponse, type RsvpStatsResponse } from "./rsvp.types";

// ─── Helpers ──────────────────────────────────────────────

async function assertWeddingExists(weddingId: number) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId, deletedAt: null },
  });
  if (!wedding) {
    throw AppError.from(RsvpErrorCode.RSVP_WEDDING_NOT_FOUND);
  }
  return wedding;
}

// ─── Create ──────────────────────────────────────────────

export async function createRsvp(
  sessionId: string,
  userId: number | undefined,
  data: {
    weddingId: number;
    attendance: string;
    name: string;
    side: string;
    phone: string;
    attendeeCount: number;
    meal: { willEat: boolean; mealCount: number };
    shuttle: { willRide: boolean; rideCount: number };
    note?: string;
    consent: boolean;
  },
): Promise<RsvpResponse> {
  await assertWeddingExists(data.weddingId);

  // 중복 제출 방지
  const existing = await prisma.rsvp.findFirst({
    where: {
      weddingId: data.weddingId,
      OR: [
        { sessionId },
        ...(userId ? [{ userId }] : []),
      ],
    },
  });
  if (existing) {
    throw AppError.from(RsvpErrorCode.RSVP_ALREADY_EXISTS);
  }

  const rsvp = await prisma.rsvp.create({
    data: {
      weddingId: data.weddingId,
      sessionId,
      userId: userId ?? null,
      attendance: data.attendance,
      name: data.name,
      side: data.side,
      phone: data.phone,
      attendeeCount: data.attendeeCount,
      willEat: data.meal.willEat,
      mealCount: data.meal.mealCount,
      willRide: data.shuttle.willRide,
      rideCount: data.shuttle.rideCount,
      note: data.note ?? null,
      consent: data.consent,
    },
  });

  return toRsvpResponse(rsvp);
}

// ─── Get My RSVP ─────────────────────────────────────────

export async function getMyRsvp(
  weddingId: number,
  sessionId: string,
  userId: number | undefined,
): Promise<RsvpResponse | null> {
  const rsvp = await prisma.rsvp.findFirst({
    where: {
      weddingId,
      OR: [
        { sessionId },
        ...(userId ? [{ userId }] : []),
      ],
    },
  });

  return rsvp ? toRsvpResponse(rsvp) : null;
}

// ─── Update ──────────────────────────────────────────────

export async function updateRsvp(
  id: number,
  sessionId: string,
  userId: number | undefined,
  data: {
    attendance: string;
    name: string;
    side: string;
    phone: string;
    attendeeCount: number;
    meal: { willEat: boolean; mealCount: number };
    shuttle: { willRide: boolean; rideCount: number };
    note?: string;
  },
): Promise<RsvpResponse> {
  const rsvp = await prisma.rsvp.findUnique({ where: { id } });
  if (!rsvp) {
    throw AppError.from(RsvpErrorCode.RSVP_NOT_FOUND);
  }

  // 소유권 확인
  const isOwner =
    rsvp.sessionId === sessionId || (userId !== undefined && rsvp.userId === userId);
  if (!isOwner) {
    throw AppError.from(RsvpErrorCode.RSVP_UNAUTHORIZED);
  }

  const updated = await prisma.rsvp.update({
    where: { id },
    data: {
      attendance: data.attendance,
      name: data.name,
      side: data.side,
      phone: data.phone,
      attendeeCount: data.attendeeCount,
      willEat: data.meal.willEat,
      mealCount: data.meal.mealCount,
      willRide: data.shuttle.willRide,
      rideCount: data.shuttle.rideCount,
      note: data.note ?? null,
    },
  });

  return toRsvpResponse(updated);
}

// ─── Delete ──────────────────────────────────────────────

export async function deleteRsvp(
  id: number,
  sessionId: string,
  userId: number | undefined,
  userRole: string | undefined,
): Promise<void> {
  const rsvp = await prisma.rsvp.findUnique({ where: { id } });
  if (!rsvp) {
    throw AppError.from(RsvpErrorCode.RSVP_NOT_FOUND);
  }

  // ADMIN은 모두 삭제 가능, HOST는 자기 웨딩만, 일반 유저는 자기 것만
  if (userRole === "ADMIN") {
    // 허용
  } else if (userRole === "HOST") {
    const user = await prisma.user.findUnique({ where: { id: userId! } });
    if (!user || user.weddingId !== rsvp.weddingId) {
      throw AppError.from(RsvpErrorCode.RSVP_UNAUTHORIZED);
    }
  } else {
    const isOwner =
      rsvp.sessionId === sessionId || (userId !== undefined && rsvp.userId === userId);
    if (!isOwner) {
      throw AppError.from(RsvpErrorCode.RSVP_UNAUTHORIZED);
    }
  }

  await prisma.rsvp.delete({ where: { id } });
}

// ─── Stats (Admin/Host) ───────────────────────────────────

export async function getRsvpStats(weddingId: number): Promise<RsvpStatsResponse> {
  const attending = await prisma.rsvp.findMany({
    where: { weddingId, attendance: "YES" },
    select: { attendeeCount: true, willEat: true, mealCount: true, willRide: true, rideCount: true },
  });

  const totalRsvpCount = await prisma.rsvp.count({ where: { weddingId } });
  const attendingCount = attending.length;
  const totalAttendeeCount = attending.reduce((sum, r) => sum + r.attendeeCount, 0);
  const totalMealCount = attending.filter((r) => r.willEat).reduce((sum, r) => sum + r.mealCount, 0);
  const totalShuttleCount = attending.filter((r) => r.willRide).reduce((sum, r) => sum + r.rideCount, 0);

  return { totalRsvpCount, attendingCount, totalAttendeeCount, totalMealCount, totalShuttleCount };
}

// ─── List (Admin/Host) ────────────────────────────────────

export async function listRsvps(
  weddingId: number,
  page: number,
  size: number,
): Promise<RsvpListResponse> {
  const { skip, take } = paginate({ page, size });

  const [items, totalCount] = await Promise.all([
    prisma.rsvp.findMany({
      where: { weddingId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.rsvp.count({ where: { weddingId } }),
  ]);

  return {
    items: items.map(toRsvpResponse),
    totalCount,
    page,
    size,
    hasNext: skip + take < totalCount,
  };
}

// ─── Export CSV (Admin/Host) ──────────────────────────────

export async function exportRsvpCsv(weddingId: number): Promise<string> {
  const items = await prisma.rsvp.findMany({
    where: { weddingId },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "ID", "참석여부", "성함", "측", "연락처",
    "참석인원", "식사여부", "식사인원", "셔틀여부", "탑승인원",
    "전달사항", "작성일시",
  ].join(",");

  const rows = items.map((r) => [
    r.id,
    r.attendance === "YES" ? "참석" : "불참",
    `"${r.name}"`,
    r.side === "BRIDE" ? "신부측" : "신랑측",
    r.phone,
    r.attendeeCount,
    r.willEat ? "예" : "아니오",
    r.mealCount,
    r.willRide ? "예" : "아니오",
    r.rideCount,
    `"${(r.note ?? "").replace(/"/g, '""')}"`,
    r.createdAt.toISOString(),
  ].join(","));

  // UTF-8 BOM for Korean characters in Excel
  return "\uFEFF" + [header, ...rows].join("\n");
}
