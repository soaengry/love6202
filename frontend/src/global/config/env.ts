export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "/api",
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
  GOOGLE_REDIRECT_URI:
    import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
    `${window.location.origin}/login/oauth2/code/google`,
  KAKAO_MAP_KEY: import.meta.env.VITE_KAKAO_MAP_KEY || "",
};
