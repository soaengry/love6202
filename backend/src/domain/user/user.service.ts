import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import { uploadImage, deleteFile } from "@/service/s3.service";
import { UserErrorCode } from "./user.error";
import { toUserResponse, getDefaultProfileImageUrl, type UserResponse } from "./user.types";

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
  data: {
    nickname?: string;
    file?: Express.Multer.File;
    removeProfileImage?: boolean;
  },
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

  // 프로필 이미지 처리
  let profileImageUrl: string | null | undefined;
  const defaultUrl = getDefaultProfileImageUrl();
  const isDefaultImage = user.profileImageUrl === null || user.profileImageUrl === defaultUrl;

  if (data.file) {
    // 새 이미지 업로드
    profileImageUrl = await uploadImage(data.file, "profiles");
    // 기존 커스텀 이미지 삭제
    if (!isDefaultImage && user.profileImageUrl) {
      await deleteFile(user.profileImageUrl);
    }
  } else if (data.removeProfileImage) {
    // 이미지 제거 → null (응답 시 default.png URL로 변환)
    profileImageUrl = null;
    if (!isDefaultImage && user.profileImageUrl) {
      await deleteFile(user.profileImageUrl);
    }
  }

  // 업데이트할 데이터 구성
  const updateData: Record<string, unknown> = {
    version: { increment: 1 },
  };
  if (data.nickname) {
    updateData.nickname = data.nickname;
  }
  if (profileImageUrl !== undefined) {
    updateData.profileImageUrl = profileImageUrl;
  }

  // 낙관적 잠금
  const updated = await prisma.user.updateMany({
    where: { id: userId, version: user.version, deletedAt: null },
    data: updateData,
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
