import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "@/middleware/auth";
import { uploadProfileImage, validateUploadedFiles } from "@/middleware/upload";
import { apiResponse } from "@/util/apiResponse";
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
  uploadProfileImage,
  validateUploadedFiles,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nickname, removeProfileImage } = req.body;
      const user = await userService.updateMe(req.userId!, {
        nickname,
        file: req.file,
        removeProfileImage: removeProfileImage === "true",
      });
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
