export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string;
  role: "GUEST" | "HOST" | "ADMIN";
  createdAt: string;
}

export interface AuthResponse {
  user: UserResponse;
}
