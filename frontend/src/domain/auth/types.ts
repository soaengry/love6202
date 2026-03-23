export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: "GUEST" | "HOST" | "ADMIN";
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface UpdateProfileRequest {
  nickname?: string;
  profileImageUrl?: string | null;
}
