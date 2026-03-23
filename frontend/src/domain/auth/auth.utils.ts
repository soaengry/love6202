import { TOKEN_KEY } from "./auth.constants.ts";

// --- Token Storage ---

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY.ACCESS);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(TOKEN_KEY.REFRESH);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY.ACCESS, accessToken);
  localStorage.setItem(TOKEN_KEY.REFRESH, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY.ACCESS);
  localStorage.removeItem(TOKEN_KEY.REFRESH);
}

// --- Device ID ---

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(TOKEN_KEY.DEVICE_ID);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY.DEVICE_ID, deviceId);
  }
  return deviceId;
}

// --- JWT ---

interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  tokenVersion: number;
  exp: number;
  iat: number;
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}
