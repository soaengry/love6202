import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import { uploadImage } from "@/service/s3.service";
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

// ─── Create ─────────────────────────────────────────────

export async function createWedding(
  userId: number,
  body: CreateWeddingBody,
  files: {
    heroImages?: Express.Multer.File[];
    groomProfileImage?: Express.Multer.File[];
    brideProfileImage?: Express.Multer.File[];
  },
): Promise<WeddingDetailResponse> {
  // 1. 사용자 확인
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw AppError.from(WeddingErrorCode.WEDDING_UNAUTHORIZED);

  // 2. 기존 wedding 중복 체크
  if (user.weddingId) {
    throw AppError.from(WeddingErrorCode.WEDDING_ALREADY_EXISTS);
  }

  // 3. Hero images 업로드 (최대 4)
  const heroFiles = files.heroImages ?? [];
  if (heroFiles.length > 4) {
    throw AppError.from(WeddingErrorCode.HERO_IMAGE_LIMIT_EXCEEDED);
  }
  const heroImageUrls = await Promise.all(
    heroFiles.map((f) => uploadImage(f, "weddings/heroes")),
  );

  // 4. Couple profile images 업로드
  const groomFile = files.groomProfileImage?.[0];
  const brideFile = files.brideProfileImage?.[0];
  const groomProfileUrl = groomFile
    ? await uploadImage(groomFile, "weddings/profiles")
    : null;
  const brideProfileUrl = brideFile
    ? await uploadImage(brideFile, "weddings/profiles")
    : null;

  // 5. Transaction으로 모든 entity 생성
  const wedding = await prisma.$transaction(async (tx) => {
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
        heroImages: {
          create: heroImageUrls.map((url, i) => ({
            imageUrl: url,
            orderIndex: i,
          })),
        },
        couples: {
          create: body.couples.map((c) => ({
            role: c.role,
            name: c.name,
            email: c.email || null,
            contact: c.contact || null,
            fatherName: c.fatherName || null,
            isFatherAlive: c.isFatherAlive,
            motherName: c.motherName || null,
            isMotherAlive: c.isMotherAlive,
            profileImageUrl:
              c.role === "GROOM" ? groomProfileUrl : brideProfileUrl,
          })),
        },
        accounts: {
          create: body.accounts.map((a) => ({
            side: a.side,
            bankName: a.bankName || null,
            bankCode: a.bankCode || null,
            accountNumber: a.accountNumber || null,
            accountHolder: a.accountHolder,
            kakaoPayUrl: a.kakaoPayUrl || null,
            tossNumber: a.tossNumber || null,
            orderIndex: a.orderIndex,
          })),
        },
        schedules: {
          create: body.schedules.map((s) => ({
            title: s.title,
            description: s.description || null,
            orderIndex: s.orderIndex,
          })),
        },
        transportations: {
          create: body.transportations.map((t) => ({
            type: t.type,
            title: t.title,
            description: t.description || null,
            orderIndex: t.orderIndex,
          })),
        },
        announcements: {
          create: body.announcements.map((a) => ({
            title: a.title,
            content: a.content,
            isPinned: a.isPinned,
          })),
        },
      },
      include: WEDDING_INCLUDE,
    });

    // User에 weddingId 연결 + role을 HOST로 업그레이드
    await tx.user.update({
      where: { id: userId },
      data: {
        weddingId: created.id,
        role: user.role === "GUEST" ? "HOST" : user.role,
      },
    });

    // Couple 이메일로 자동 HOST 부여
    const coupleEmails = body.couples
      .map((c) => c.email)
      .filter((e): e is string => !!e);
    await syncCoupleHosts(tx, created.id, coupleEmails, [], userId);

    return created;
  });

  return toWeddingDetailResponse(wedding);
}

// ─── Update ─────────────────────────────────────────────

export async function updateWedding(
  userId: number,
  weddingId: number,
  body: UpdateWeddingBody,
  files: {
    heroImages?: Express.Multer.File[];
    groomProfileImage?: Express.Multer.File[];
    brideProfileImage?: Express.Multer.File[];
  },
): Promise<WeddingDetailResponse> {
  // 1. 권한 확인
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

  // 2. 기존 이미지 조회 (새 파일 미업로드 시 보존용)
  const existingCouples = await prisma.couple.findMany({ where: { weddingId } });
  const existingGroomProfileUrl = existingCouples.find((c) => c.role === "GROOM")?.profileImageUrl ?? null;
  const existingBrideProfileUrl = existingCouples.find((c) => c.role === "BRIDE")?.profileImageUrl ?? null;

  // 3. 이미지 업로드
  const heroFiles = files.heroImages ?? [];
  if (heroFiles.length > 4) {
    throw AppError.from(WeddingErrorCode.HERO_IMAGE_LIMIT_EXCEEDED);
  }
  const newHeroImageUrls = await Promise.all(
    heroFiles.map((f) => uploadImage(f, "weddings/heroes")),
  );
  // 기존 유지할 hero URL + 새로 업로드된 URL
  const existingHeroUrls: string[] = body.existingHeroImageUrls ?? [];
  const allHeroImageUrls = [...existingHeroUrls, ...newHeroImageUrls];

  const groomFile = files.groomProfileImage?.[0];
  const brideFile = files.brideProfileImage?.[0];
  const groomProfileUrl = groomFile
    ? await uploadImage(groomFile, "weddings/profiles")
    : existingGroomProfileUrl;
  const brideProfileUrl = brideFile
    ? await uploadImage(brideFile, "weddings/profiles")
    : existingBrideProfileUrl;

  // 4. 주소 변경 여부 확인
  const addressChanged = wedding.venueAddress !== body.wedding.venueAddress;

  // 5. 기존/신규 couple 이메일 추출
  const oldCoupleEmails = existingCouples
    .map((c) => c.email)
    .filter((e): e is string => !!e);
  const newCoupleEmails = body.couples
    .map((c) => c.email)
    .filter((e): e is string => !!e);

  // 6. Transaction: 본체 update + 서브 리소스 delete-recreate
  const updated = await prisma.$transaction(async (tx) => {
    // 기존 서브 리소스 삭제
    await tx.heroImage.deleteMany({ where: { weddingId } });
    await tx.couple.deleteMany({ where: { weddingId } });
    await tx.account.deleteMany({ where: { weddingId } });
    await tx.schedule.deleteMany({ where: { weddingId } });
    await tx.transportation.deleteMany({ where: { weddingId } });
    await tx.announcement.deleteMany({ where: { weddingId } });

    // Wedding 본체 + 서브 리소스 재생성
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
        heroImages: {
          create: allHeroImageUrls.map((url, i) => ({
            imageUrl: url,
            orderIndex: i,
          })),
        },
        couples: {
          create: body.couples.map((c) => ({
            role: c.role,
            name: c.name,
            email: c.email || null,
            contact: c.contact || null,
            fatherName: c.fatherName || null,
            isFatherAlive: c.isFatherAlive,
            motherName: c.motherName || null,
            isMotherAlive: c.isMotherAlive,
            profileImageUrl:
              c.role === "GROOM" ? groomProfileUrl : brideProfileUrl,
          })),
        },
        accounts: {
          create: body.accounts.map((a) => ({
            side: a.side,
            bankName: a.bankName || null,
            bankCode: a.bankCode || null,
            accountNumber: a.accountNumber || null,
            accountHolder: a.accountHolder,
            kakaoPayUrl: a.kakaoPayUrl || null,
            tossNumber: a.tossNumber || null,
            orderIndex: a.orderIndex,
          })),
        },
        schedules: {
          create: body.schedules.map((s) => ({
            title: s.title,
            description: s.description || null,
            orderIndex: s.orderIndex,
          })),
        },
        transportations: {
          create: body.transportations.map((t) => ({
            type: t.type,
            title: t.title,
            description: t.description || null,
            orderIndex: t.orderIndex,
          })),
        },
        announcements: {
          create: body.announcements.map((a) => ({
            title: a.title,
            content: a.content,
            isPinned: a.isPinned,
          })),
        },
      },
      include: WEDDING_INCLUDE,
    });

    // Couple 이메일로 자동 HOST 부여/해제
    await syncCoupleHosts(tx, weddingId, newCoupleEmails, oldCoupleEmails, wedding!.userId);

    return result;
  });

  return toWeddingDetailResponse(updated);
}

// ─── Read ───────────────────────────────────────────────

export async function getLatestWedding(): Promise<WeddingDetailResponse> {
  const wedding = await prisma.wedding.findFirst({
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

  // 권한 확인: 생성자 또는 ADMIN
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
  // [SECURITY] 커플 이메일 일치 유저에게 HOST 권한 자동 부여 제거
  // → 권한 부여는 별도 초대/수락 플로우에서만 처리해야 함
  // → 자동 부여 시 공격자가 자신의 이메일을 커플로 등록해 HOST 탈취 가능

  // 해제: 제거된 couple 이메일의 유저 → GUEST + weddingId 해제 (배치)
  const removedEmails = oldEmails.filter((e) => !newEmails.includes(e));
  if (removedEmails.length > 0) {
    const usersToRevoke = await tx.user.findMany({
      where: { email: { in: removedEmails }, deletedAt: null, weddingId, id: { not: creatorUserId }, role: "HOST" },
      select: { id: true },
    });
    if (usersToRevoke.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: usersToRevoke.map((u) => u.id) } },
        data: { weddingId: null, role: "GUEST" },
      });
    }
  }
}
