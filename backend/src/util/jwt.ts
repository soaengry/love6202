import jwt from "jsonwebtoken";
import { env } from "@/config/env";

interface TokenPayload {
  userId: number;
  email: string;
  role: string;
  tokenVersion: number;
}

export function generateAccessToken(user: {
  id: number;
  email: string;
  role: string;
  tokenVersion: number;
}) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRATION / 1000 }, // seconds
  );
}

export function generateRefreshToken(
  userId: number,
  deviceId: string,
  tokenVersion: number,
) {
  return jwt.sign({ userId, deviceId, tokenVersion }, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRATION / 1000,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
