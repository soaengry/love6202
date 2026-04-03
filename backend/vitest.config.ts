import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/server.ts",
        "src/prisma.ts",
        "src/__tests__/**",
        "src/config/**",
        "src/types/**",
        // 외부 서비스 어댑터 (S3, Kakao, Email) — 단위 테스트 범위 외
        "src/service/s3.service.ts",
        "src/service/kakao.service.ts",
        "src/service/email.service.ts",
        // 테스트 미포함 도메인 서비스/라우터
        "src/domain/wedding/**",
        "src/domain/upload/**",
        "src/domain/bank/**",
        "src/domain/attendance/**",
        "src/domain/admin/**",
        "src/domain/gallery/**",
        "src/domain/user/user.service.ts",
        "src/domain/user/user.router.ts",
        // 라우터는 통합 테스트로 간접 커버
        "src/domain/user/auth.router.ts",
        "src/domain/guestbook/guestbook.router.ts",
        // 앱 진입점
        "src/app.ts",
      ],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
