import { Router, Request, Response, NextFunction } from "express";
import { validate } from "@/middleware/validate";
import { authenticate } from "@/middleware/auth";
import { apiResponse } from "@/util/apiResponse";
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
      res.json(apiResponse.ok("로그인 성공", result));
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
      const { refreshToken, deviceId } = req.body;
      const result = await authService.refresh(refreshToken, deviceId);
      res.json(apiResponse.ok("토큰 갱신 성공", result));
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
