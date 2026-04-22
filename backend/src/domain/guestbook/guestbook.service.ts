import type { Response } from "express";
import prisma from "@/prisma";
import redis, { createSubscriber } from "@/config/redis";
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

  // Redis Pub/Sub — 실시간 알림
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

  // HOST의 경우 자기 초대장의 방명록만 삭제 가능
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === "HOST" && user.weddingId !== guestbook.weddingId) {
    throw AppError.from(GuestbookErrorCode.GUESTBOOK_UNAUTHORIZED);
  }

  await prisma.guestbook.delete({ where: { id: guestbookId } });
}

// ─── SSE Subscribe ───────────────────────────────────────

export function subscribeGuestbook(weddingId: number, res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const subscriber = createSubscriber();
  const channel = `guestbook:wedding:${weddingId}`;

  subscriber.subscribe(channel);
  subscriber.on("message", (_ch: string, message: string) => {
    res.write(`data: ${message}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30_000);

  res.on("close", () => {
    clearInterval(heartbeat);
    subscriber.unsubscribe(channel);
    subscriber.disconnect();
  });
}
