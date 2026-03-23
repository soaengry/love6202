import { User, Role } from "@prisma/client";
import { env } from "@/config/env";

export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string;
  role: Role;
  createdAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export function getDefaultProfileImageUrl(): string {
  return `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/profiles/default.png`;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    profileImageUrl: user.profileImageUrl ?? getDefaultProfileImageUrl(),
    role: user.role,
    createdAt: user.createdAt,
  };
}
