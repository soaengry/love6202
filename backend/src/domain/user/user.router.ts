import { Router, Request, Response, NextFunction } from "express";
import { validate } from "@/middleware/validate";
import { authenticate } from "@/middleware/auth";
import { apiResponse } from "@/util/apiResponse";
import { updateProfileSchema } from "./user.schema";
import * as userService from "./user.service";

const router = Router();

router.use(authenticate);

router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getMe(req.userId!);
    res.json(apiResponse.ok("프로필 조회 성공", user));
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/me",
  validate({ body: updateProfileSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateMe(req.userId!, req.body);
      res.json(apiResponse.ok("프로필 수정 성공", user));
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/me",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.deleteMe(req.userId!);
      res.json(apiResponse.ok("회원 탈퇴 성공", null));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
