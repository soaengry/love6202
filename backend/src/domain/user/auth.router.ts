import { Router, Request, Response, NextFunction } from "express";
import { validate } from "@/middleware/validate";
import { authenticate } from "@/middleware/auth";
import { rotateSession } from "@/middleware/session";
import { apiResponse } from "@/util/apiResponse";
import { setAuthCookies, clearAuthCookies, COOKIE_NAMES } from "@/util/cookie";
import { loginSchema, refreshSchema, checkNicknameSchema } from "./user.schema";
import * as authService from "./auth.service";

const router = Router();

router.post(
  "/login",
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, deviceId } = req.body;
      const result = await authService.googleLogin(code, deviceId);
      rotateSession(req, res); // Session Fixation 방지
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json(apiResponse.ok("로그인 성공", { user: result.user }));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/refresh",
  validate({ body: refreshSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
      if (!refreshToken) {
        return res.status(401).json(apiResponse.error(401, "NO_REFRESH_TOKEN"));
      }
      const { deviceId } = req.body;
      const result = await authService.refresh(refreshToken, deviceId);
      rotateSession(req, res); // 토큰 갱신 시 세션 ID 교체
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json(apiResponse.ok("토큰 갱신 성공", null));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/logout",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { deviceId } = req.body;
      await authService.logout(req.userId!, deviceId);
      clearAuthCookies(res);
      res.json(apiResponse.ok("로그아웃 성공", null));
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/check-nickname",
  validate({ body: checkNicknameSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.checkNickname(req.body.nickname);
      res.json(apiResponse.ok("닉네임 확인 완료", result));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
