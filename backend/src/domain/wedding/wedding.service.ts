import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import { uploadOptimizedImage, deleteFile } from "@/service/s3.service";
import { geocode } from "@/service/kakao.service";
import { WeddingErrorCode } from "./wedding.error";
import {
  toWeddingDetailResponse,
  type WeddingDetailResponse,
} from "./wedding.types";
import type { CreateWeddingBody, UpdateWeddingBody } from "./wedding.schema";

import type { Prisma } from "@prisma/client";

type TxClient = Prisma.TransactionClient;

const WEDDING_INCLUDE = {
  heroImages: true,
  couples: true,
  accounts: true,
  schedules: true,
  transportations: true,
  announcements: true,
} as const;

// ─── Sub-resource builders ───────────────────────────────

type HeroImageInput = {
  imageUrl: string;
  webpUrl: string | null;
  width: number | null;
  height: number | null;
};

function buildHeroImages(images: HeroImageInput[]) {
  return images.map((img, i) => ({ ...img, orderIndex: i }));
}

function buildCouples(
  couples: CreateWeddingBody["couples"],
  groomProfileUrl: string | null,
  brideProfileUrl: string | null,
) {
  return couples.map((c) => ({
    role: c.role,
    name: c.name,
    email: c.email || null,
    contact: c.contact || null,
    fatherName: c.fatherName || null,
    isFatherAlive: c.isFatherAlive,
    motherName: c.motherName || null,
    isMotherAlive: c.isMotherAlive,
    profileImageUrl: c.role === "GROOM" ? groomProfileUrl : brideProfileUrl,
  }));
}

function buildAccounts(accounts: CreateWeddingBody["accounts"]) {
  return accounts.map((a) => ({
    side: a.side,
    bankName: a.bankName || null,
    bankCode: a.bankCode || null,
    accountNumber: a.accountNumber || null,
    accountHolder: a.accountHolder,
    kakaoPayUrl: a.kakaoPayUrl || null,
    tossNumber: a.tossNumber || null,
    orderIndex: a.orderIndex,
  }));
}

function buildSchedules(schedules: CreateWeddingBody["schedules"]) {
  return schedules.map((s) => ({
    title: s.title,
    description: s.description || null,
    orderIndex: s.orderIndex,
  }));
}

function buildTransportations(transportations: CreateWeddingBody["transportations"]) {
  return transportations.map((t) => ({
    type: t.type,
    title: t.title,
    description: t.description || null,
    orderIndex: t.orderIndex,
  }));
}

function buildAnnouncements(announcements: CreateWeddingBody["announcements"]) {
  return announcements.map((a) => ({
    title: a.title,
    content: a.content,
    isPinned: a.isPinned,
  }));
}

// ─── Image upload helpers ────────────────────────────────

type WeddingFiles = {
  heroImages?: Express.Multer.File[];
  groomProfileImage?: Express.Multer.File[];
  brideProfileImage?: Express.Multer.File[];
};

async function uploadWeddingImages(files: WeddingFiles): Promise<{
  heroImages: HeroImageInput[];
  groomProfileUrl: string | null;
  brideProfileUrl: string | null;
}> {
  const heroFiles = files.heroImages ?? [];
  if (heroFiles.length > 4) {
    throw AppError.from(WeddingErrorCode.HERO_IMAGE_LIMIT_EXCEEDED);
  }

  const uploadedHeroImages = await Promise.all(
    heroFiles.map((f) => uploadOptimizedImage(f, "weddings/heroes", 1920)),
  );
  const heroImages: HeroImageInput[] = uploadedHeroImages.map((h) => ({
    imageUrl: h.url,
    webpUrl: h.webpUrl,
    width: h.width,
    height: h.height,
  }));
  // 프로필 이미지는 webp 사본을 저장할 컬럼이 없으므로 생성하지 않음 (orphan 방지)
  const groomProfileUrl = files.groomProfileImage?.[0]
    ? (await uploadOptimizedImage(files.groomProfileImage[0], "weddings/profiles", 400, 80, false)).url
    : null;
  const brideProfileUrl = files.brideProfileImage?.[0]
    ? (await uploadOptimizedImage(files.brideProfileImage[0], "weddings/profiles", 400, 80, false)).url
    : null;

  return { heroImages, groomProfileUrl, brideProfileUrl };
}

async function cleanupUploadedImages(urls: (string | null)[]): Promise<void> {
  await Promise.allSettled(
    urls.filter((u): u is string => u !== null).map(deleteFile),
  );
}

// ─── Create ─────────────────────────────────────────────

export async function createWedding(
  userId: number,
  body: CreateWeddingBody,
  files: WeddingFiles,
): Promise<WeddingDetailResponse> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw AppError.from(WeddingErrorCode.WEDDING_UNAUTHORIZED);

  if (user.weddingId) {
    throw AppError.from(WeddingErrorCode.WEDDING_ALREADY_EXISTS);
  }

  const { heroImages, groomProfileUrl, brideProfileUrl } =
    await uploadWeddingImages(files);

  let wedding;
  try {
    wedding = await prisma.$transaction(async (tx) => {
      const created = await tx.wedding.create({
        data: {
          userId: userId,
          title: body.wedding.title,
          weddingDate: new Date(body.wedding.weddingDate),
          venueName: body.wedding.venueName,
          venueAddress: body.wedding.venueAddress,
          venueDetail: body.wedding.venueDetail || null,
          dressCode: body.wedding.dressCode || null,
          notice: body.wedding.notice || null,
          parkingInfo: body.wedding.parkingInfo || null,
          mealInfo: body.wedding.mealInfo || null,
          greeting: body.wedding.greeting || null,
          heroImages: { create: buildHeroImages(heroImages) },
          couples: { create: buildCouples(body.couples, groomProfileUrl, brideProfileUrl) },
          accounts: { create: buildAccounts(body.accounts) },
          schedules: { create: buildSchedules(body.schedules) },
          transportations: { create: buildTransportations(body.transportations) },
          announcements: { create: buildAnnouncements(body.announcements) },
        },
        include: WEDDING_INCLUDE,
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          weddingId: created.id,
          role: user.role === "GUEST" ? "HOST" : user.role,
        },
      });

      const coupleEmails = body.couples
        .map((c) => c.email)
        .filter((e): e is string => !!e);
      await syncCoupleHosts(tx, created.id, coupleEmails, [], userId);

      return created;
    });
  } catch (err) {
    await cleanupUploadedImages([
      ...heroImages.flatMap((h) => [h.imageUrl, h.webpUrl]),
      groomProfileUrl,
      brideProfileUrl,
    ]);
    throw err;
  }

  return toWeddingDetailResponse(wedding);
}

// ─── Update ─────────────────────────────────────────────

export async function updateWedding(
  userId: number,
  weddingId: number,
  body: UpdateWeddingBody,
  files: WeddingFiles,
): Promise<WeddingDetailResponse> {
  const wedding = await prisma.wedding.findFirst({
    where: { id: weddingId, deletedAt: null },
  });
  if (!wedding) throw AppError.from(WeddingErrorCode.WEDDING_NOT_FOUND);

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user || (user.weddingId !== weddingId && user.role !== "ADMIN")) {
    throw AppError.from(WeddingErrorCode.WEDDING_UNAUTHORIZED);
  }

  const existingCouples = await prisma.couple.findMany({ where: { weddingId } });
  const existingGroomProfileUrl =
    existingCouples.find((c) => c.role === "GROOM")?.profileImageUrl ?? null;
  const existingBrideProfileUrl =
    existingCouples.find((c) => c.role === "BRIDE")?.profileImageUrl ?? null;

  const currentHeroImages = await prisma.heroImage.findMany({ where: { weddingId } });

  const { heroImages: newHeroImages, groomProfileUrl: newGroomUrl, brideProfileUrl: newBrideUrl } =
    await uploadWeddingImages(files);

  const existingHeroUrls: string[] = body.existingHeroImageUrls ?? [];
  // 유지되는 기존 히어로 이미지는 webp/width/height 메타데이터도 함께 보존
  const keptHeroImages: HeroImageInput[] = currentHeroImages
    .filter((h) => existingHeroUrls.includes(h.imageUrl))
    .map((h) => ({ imageUrl: h.imageUrl, webpUrl: h.webpUrl, width: h.width, height: h.height }));
  const allHeroImages = [...keptHeroImages, ...newHeroImages];

  // 제거된 히어로 이미지 (유지하지 않는 기존 이미지) — jpeg/webp 사본 모두 삭제 대상
  const removedHeroUrls = currentHeroImages
    .filter((h) => !existingHeroUrls.includes(h.imageUrl))
    .flatMap((h) => [h.imageUrl, h.webpUrl]);
  const groomProfileUrl = newGroomUrl ?? existingGroomProfileUrl;
  const brideProfileUrl = newBrideUrl ?? existingBrideProfileUrl;

  const addressChanged = wedding.venueAddress !== body.wedding.venueAddress;

  const oldCoupleEmails = existingCouples
    .map((c) => c.email)
    .filter((e): e is string => !!e);
  const newCoupleEmails = body.couples
    .map((c) => c.email)
    .filter((e): e is string => !!e);

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      await tx.heroImage.deleteMany({ where: { weddingId } });
      await tx.couple.deleteMany({ where: { weddingId } });
      await tx.account.deleteMany({ where: { weddingId } });
      await tx.schedule.deleteMany({ where: { weddingId } });
      await tx.transportation.deleteMany({ where: { weddingId } });
      await tx.announcement.deleteMany({ where: { weddingId } });

      const result = await tx.wedding.update({
        where: { id: weddingId, version: wedding.version },
        data: {
          title: body.wedding.title,
          weddingDate: new Date(body.wedding.weddingDate),
          venueName: body.wedding.venueName,
          venueAddress: body.wedding.venueAddress,
          venueDetail: body.wedding.venueDetail || null,
          venueLat: addressChanged ? null : wedding.venueLat,
          venueLng: addressChanged ? null : wedding.venueLng,
          dressCode: body.wedding.dressCode || null,
          notice: body.wedding.notice || null,
          parkingInfo: body.wedding.parkingInfo || null,
          mealInfo: body.wedding.mealInfo || null,
          greeting: body.wedding.greeting || null,
          version: { increment: 1 },
          heroImages: { create: buildHeroImages(allHeroImages) },
          couples: { create: buildCouples(body.couples, groomProfileUrl, brideProfileUrl) },
          accounts: { create: buildAccounts(body.accounts) },
          schedules: { create: buildSchedules(body.schedules) },
          transportations: { create: buildTransportations(body.transportations) },
          announcements: { create: buildAnnouncements(body.announcements) },
        },
        include: WEDDING_INCLUDE,
      });

      await syncCoupleHosts(tx, weddingId, newCoupleEmails, oldCoupleEmails, wedding.userId);

      return result;
    });
  } catch (err) {
    await cleanupUploadedImages([
      ...newHeroImages.flatMap((h) => [h.imageUrl, h.webpUrl]),
      newGroomUrl,
      newBrideUrl,
    ]);
    throw err;
  }

  // 트랜잭션 성공 후 제거된 히어로 이미지 S3 삭제
  await cleanupUploadedImages(removedHeroUrls);

  return toWeddingDetailResponse(updated);
}

// ─── Read ───────────────────────────────────────────────

export async function getLatestWedding(): Promise<WeddingDetailResponse> {
  const pinned = await prisma.wedding.findFirst({
    where: { deletedAt: null, isPinned: true },
    include: WEDDING_INCLUDE,
  });

  const wedding = pinned ?? await prisma.wedding.findFirst({
    where: { deletedAt: null },
    orderBy: { id: "desc" },
    include: WEDDING_INCLUDE,
  });

  if (!wedding) throw AppError.from(WeddingErrorCode.WEDDING_NOT_FOUND);

  await resolveGeocode(wedding);
  return toWeddingDetailResponse(wedding);
}

export async function getWedding(
  weddingId: number,
): Promise<WeddingDetailResponse> {
  const wedding = await prisma.wedding.findFirst({
    where: { id: weddingId, deletedAt: null },
    include: WEDDING_INCLUDE,
  });
  if (!wedding) throw AppError.from(WeddingErrorCode.WEDDING_NOT_FOUND);

  await resolveGeocode(wedding);
  return toWeddingDetailResponse(wedding);
}

export async function getMyWedding(
  userId: number,
): Promise<WeddingDetailResponse | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) return null;

  const wedding = await prisma.wedding.findFirst({
    where: {
      deletedAt: null,
      couples: { some: { email: user.email } },
    },
    include: WEDDING_INCLUDE,
  });
  if (!wedding) return null;

  return toWeddingDetailResponse(wedding);
}

// ─── Delete ─────────────────────────────────────────────

export async function deleteWedding(
  userId: number,
  weddingId: number,
): Promise<void> {
  const wedding = await prisma.wedding.findFirst({
    where: { id: weddingId, deletedAt: null },
  });
  if (!wedding) throw AppError.from(WeddingErrorCode.WEDDING_NOT_FOUND);

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user || (user.weddingId !== weddingId && user.role !== "ADMIN")) {
    throw AppError.from(WeddingErrorCode.WEDDING_UNAUTHORIZED);
  }

  await prisma.wedding.update({
    where: { id: weddingId },
    data: { deletedAt: new Date() },
  });
}

// ─── Helpers ────────────────────────────────────────────

async function resolveGeocode(wedding: {
  id: number;
  venueAddress: string;
  venueLat: number | null;
  venueLng: number | null;
}) {
  if (wedding.venueLat !== null && wedding.venueLng !== null) return;

  const coord = await geocode(wedding.venueAddress).catch(() => null);
  if (!coord) return;

  await prisma.wedding.update({
    where: { id: wedding.id },
    data: { venueLat: coord.lat, venueLng: coord.lng },
  });
  wedding.venueLat = coord.lat;
  wedding.venueLng = coord.lng;
}

async function syncCoupleHosts(
  tx: TxClient,
  weddingId: number,
  newEmails: string[],
  oldEmails: string[],
  creatorUserId: number,
): Promise<void> {
  // [SECURITY] 커플 이메일 자동 HOST 부여 제거
  // → 공격자가 자신의 이메일을 커플로 등록해 HOST 탈취 가능
  const removedEmails = oldEmails.filter((e) => !newEmails.includes(e));
  if (removedEmails.length === 0) return;

  const usersToRevoke = await tx.user.findMany({
    where: {
      email: { in: removedEmails },
      deletedAt: null,
      weddingId,
      id: { not: creatorUserId },
      role: "HOST",
    },
    select: { id: true },
  });
  if (usersToRevoke.length > 0) {
    await tx.user.updateMany({
      where: { id: { in: usersToRevoke.map((u) => u.id) } },
      data: { weddingId: null, role: "GUEST" },
    });
  }
}
