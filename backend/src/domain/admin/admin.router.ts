import { Router, Request, Response, NextFunction } from "express";
import { authenticate, requireAdmin } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { apiResponse } from "@/util/apiResponse";
import { searchUsersQuerySchema, changeRoleBodySchema, userIdParamSchema } from "./admin.schema";
import * as adminService from "./admin.service";

const router = Router();

router.use(authenticate, requireAdmin);

// GET /api/admin/weddings — 전체 웨딩 목록
router.get(
  "/weddings",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await adminService.getAllWeddings();
      res.json(apiResponse.ok("웨딩 목록 조회 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/admin/users/search?query=xxx — 사용자 검색
router.get(
  "/users/search",
  validate({ query: searchUsersQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query as unknown as { query: string };
      const result = await adminService.searchUsers(query);
      res.json(apiResponse.ok("사용자 검색 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/admin/users/:id/role — 사용자 권한 변경
router.patch(
  "/users/:id/role",
  validate({ params: userIdParamSchema, body: changeRoleBodySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params as unknown as { id: number };
      const { role } = req.body;
      const result = await adminService.changeUserRole(req.userId!, id, role);
      res.json(apiResponse.ok("권한 변경 성공", result));
    } catch (err) {
      next(err);
    }
  },
);

export default router;
