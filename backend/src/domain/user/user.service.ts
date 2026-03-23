import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import { UserErrorCode } from "./user.error";
import { toUserResponse, type UserResponse } from "./user.types";

export async function getMe(userId: number): Promise<UserResponse> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) {
    throw AppError.from(UserErrorCode.USER_NOT_FOUND);
  }
  return toUserResponse(user);
}

export async function updateMe(
  userId: number,
  data: { nickname?: string; profileImageUrl?: string | null },
): Promise<UserResponse> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) {
    throw AppError.from(UserErrorCode.USER_NOT_FOUND);
  }

  // 닉네임 중복 확인
  if (data.nickname && data.nickname !== user.nickname) {
    const exists = await prisma.user.findUnique({
      where: { nickname: data.nickname },
    });
    if (exists) {
      throw AppError.from(UserErrorCode.DUPLICATE_NICKNAME);
    }
  }

  // 낙관적 잠금
  const updated = await prisma.user.updateMany({
    where: { id: userId, version: user.version, deletedAt: null },
    data: {
      ...data,
      version: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    throw AppError.from(UserErrorCode.CONCURRENT_UPDATE);
  }

  const result = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return toUserResponse(result);
}

export async function deleteMe(userId: number): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) {
    throw AppError.from(UserErrorCode.USER_NOT_FOUND);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      tokenVersion: { increment: 1 },
    },
  });
}
