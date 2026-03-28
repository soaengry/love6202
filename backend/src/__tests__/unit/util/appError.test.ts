import { describe, it, expect } from "vitest";
import { AppError } from "@/util/appError";

describe("AppError", () => {
  describe("constructor", () => {
    it("code, statusCode, message를 올바르게 설정한다", () => {
      const err = new AppError("USER_NOT_FOUND", 404, "사용자를 찾을 수 없습니다.");

      expect(err.code).toBe("USER_NOT_FOUND");
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe("사용자를 찾을 수 없습니다.");
    });

    it("message 생략 시 code가 message로 사용된다", () => {
      const err = new AppError("USER_NOT_FOUND", 404);

      expect(err.message).toBe("USER_NOT_FOUND");
    });

    it("Error 클래스를 상속한다", () => {
      const err = new AppError("TEST_ERROR", 400);

      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it("name이 Error다", () => {
      const err = new AppError("TEST_ERROR", 400);

      // Error.name 기본값
      expect(err instanceof Error).toBe(true);
    });
  });

  describe("AppError.from()", () => {
    it("errorCode 객체의 status → statusCode로 매핑된다", () => {
      const errorCode = {
        code: "DUPLICATE_EMAIL",
        status: 409,
        message: "이미 사용 중인 이메일입니다.",
      };

      const err = AppError.from(errorCode);

      expect(err.code).toBe("DUPLICATE_EMAIL");
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe("이미 사용 중인 이메일입니다.");
    });

    it("생성된 인스턴스는 AppError이다", () => {
      const err = AppError.from({ code: "TEST", status: 400, message: "msg" });
      expect(err).toBeInstanceOf(AppError);
    });
  });
});
