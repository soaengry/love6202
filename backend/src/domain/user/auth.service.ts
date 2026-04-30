import axios from "axios";
import prisma from "@/prisma";
import redis from "@/config/redis";
import { env } from "@/config/env";
import { generateAccessToken, generateRefreshToken, verifyToken } from "@/util/jwt";
import * as refreshTokenService from "@/service/refreshToken.service";
import { sendNewDeviceLoginAlert } from "@/service/email.service";
import { generateNickname } from "@/util/nickname";
import { AppError } from "@/util/appError";
import { UserErrorCode } from "./user.error";
import { toUserResponse, AuthResponse } from "./user.types";

const MAX_DEVICES = 5;

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

async function getGoogleTokens(code: string): Promise<GoogleTokenResponse> {
  try {
    const { data } = await axios.post<GoogleTokenResponse>(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      },
    );
    return data;
  } catch {
    throw AppError.from(UserErrorCode.AUTH_GOOGLE_FAILED);
  }
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const { data } = await axios.get<GoogleUserInfo>(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

async function generateUniqueNickname(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const nickname = generateNickname();
    const exists = await prisma.user.findUnique({ where: { nickname } });
    if (!exists) return nickname;
  }
  return `${generateNickname()}${Date.now() % 10000}`;
}

export async function googleLogin(
  code: string,
  deviceId: string,
): Promise<AuthResponse> {
  const tokens = await getGoogleTokens(code);
  const googleUser = await getGoogleUserInfo(tokens.access_token);

  let user = await prisma.user.findFirst({
    where: { email: googleUser.email },
  });

  if (user && user.deletedAt) {
    const daysSinceDeleted =
      (Date.now() - user.deletedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDeleted > 30) {
      throw AppError.from(UserErrorCode.ACCOUNT_PERMANENTLY_DELETED);
    }
    user = await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: null, providerId: googleUser.sub },
    });
  } else if (!user) {
    const nickname = await generateUniqueNickname();
    user = await prisma.user.create({
      data: {
        email: googleUser.email,
        nickname,
        profileImageUrl: googleUser.picture,
        providerId: googleUser.sub,
      },
    });
  }

  await refreshTokenService.ensureDeviceLimit(user.id, MAX_DEVICES);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id, deviceId, user.tokenVersion);
  await refreshTokenService.save(user.id, deviceId, refreshToken);

  // 새 기기 감지 → 이메일 알림 (fire-and-forget)
  const knownDeviceKey = `known_devices:${user.id}`;
  const isNewDevice = !(await redis.sismember(knownDeviceKey, deviceId));
  if (isNewDevice) {
    await redis.sadd(knownDeviceKey, deviceId);
    sendNewDeviceLoginAlert(user.email, deviceId).catch(() => {/* 이메일 실패는 로그인 차단하지 않음 */});
  }

  return { accessToken, refreshToken, user: toUserResponse(user) };
}

export async function refresh(
  token: string,
  deviceId: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw AppError.from(UserErrorCode.AUTH_INVALID_REFRESH_TOKEN);
  }

  const isValid = await refreshTokenService.verify(payload.userId, deviceId, token);
  if (!isValid) {
    throw AppError.from(UserErrorCode.AUTH_INVALID_REFRESH_TOKEN);
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.userId, deletedAt: null },
  });
  if (!user) {
    throw AppError.from(UserErrorCode.USER_NOT_FOUND);
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    await refreshTokenService.deleteAllByUser(user.id);
    throw AppError.from(UserErrorCode.AUTH_TOKEN_REVOKED);
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user.id, deviceId, user.tokenVersion);
  await refreshTokenService.save(user.id, deviceId, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: number, deviceId: string): Promise<void> {
  await refreshTokenService.deleteByDevice(userId, deviceId);
}

export async function checkNickname(
  nickname: string,
): Promise<{ available: boolean }> {
  const user = await prisma.user.findUnique({ where: { nickname } });
  return { available: !user };
}
