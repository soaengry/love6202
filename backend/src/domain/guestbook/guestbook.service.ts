import prisma from "@/prisma";
import redis from "@/config/redis";
import { AppError } from "@/util/appError";
import { paginate } from "@/util/pagination";
import { GuestbookErrorCode } from "./guestbook.error";
import { toGuestbookResponse, type GuestbookListResponse, type GuestbookResponse } from "./guestbook.types";

// ─── List ────────────────────────────────────────────────

export async function getGuestbooks(
  weddingId: number,
  page: number,
  size: number,
): Promise<GuestbookListResponse> {
  const { skip, take } = paginate({ page, size });

  const [items, totalCount] = await Promise.all([
    prisma.guestbook.findMany({
      where: { weddingId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.guestbook.count({ where: { weddingId } }),
  ]);

  return {
    items: items.map(toGuestbookResponse),
    totalCount,
    page,
    size,
    hasNext: skip + take < totalCount,
  };
}

// ─── Create ──────────────────────────────────────────────

export async function createGuestbook(data: {
  weddingId: number;
  name: string;
  content: string;
  type: string;
}): Promise<GuestbookResponse> {
  // 초대장 존재 확인
  const wedding = await prisma.wedding.findUnique({
    where: { id: data.weddingId, deletedAt: null },
  });
  if (!wedding) {
    throw AppError.from(GuestbookErrorCode.GUESTBOOK_WEDDING_NOT_FOUND);
  }

  const rotation = Math.random() * 16 - 8; // -8 ~ 8

  const guestbook = await prisma.guestbook.create({
    data: {
      weddingId: data.weddingId,
      name: data.name,
      content: data.content,
      type: data.type,
      rotation,
    },
  });

  const response = toGuestbookResponse(guestbook);

  // Redis Pub/Sub — 알림
  await redis.publish(
    `guestbook:wedding:${data.weddingId}`,
    JSON.stringify(response),
  );

  return response;
}

// ─── Delete ──────────────────────────────────────────────

export async function deleteGuestbook(
  userId: number,
  guestbookId: number,
): Promise<void> {
  const guestbook = await prisma.guestbook.findUnique({
    where: { id: guestbookId },
  });
  if (!guestbook) {
    throw AppError.from(GuestbookErrorCode.GUESTBOOK_NOT_FOUND);
  }

  // ADMIN/HOST 권한은 라우터 미들웨어에서 이미 확인됨
  // HOST의 경우 자기 초대장의 방명록만 삭제 가능한지 추가 확인
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === "HOST" && user.weddingId !== guestbook.weddingId) {
    throw AppError.from(GuestbookErrorCode.GUESTBOOK_UNAUTHORIZED);
  }

  await prisma.guestbook.delete({ where: { id: guestbookId } });
}
