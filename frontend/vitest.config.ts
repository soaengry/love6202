import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/app/**",
        "src/__tests__/**",
        "src/global/config/**",
        "src/**/pages/**",
        "src/**/components/**",
        // API 함수, 훅, 타입, 상수 — 단위 테스트 범위 외
        "src/domain/**/api/**",  // 도메인 API 함수 (미테스트)
        "src/**/hooks/**",
        "src/**/types.ts",
        "src/**/*.constants.ts",
        // 미테스트 도메인
        "src/domain/gallery/**",
        "src/domain/guestbook/**",
        "src/domain/upload/**",
        "src/domain/user/**",
        "src/domain/schedule/**",
        "src/global/hooks/**",
        "src/global/types/**",
      ],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
