import { Router, Request, Response, NextFunction } from "express";
import prisma from "@/prisma";
import { apiResponse } from "@/util/apiResponse";

const router = Router();

// GET /api/banks/detect — 계좌번호로 은행 자동 감지
router.get(
  "/detect",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = (req.query.accountNumber as string) ?? "";
      const digits = raw.replace(/\D/g, "");

      if (!digits) {
        res.status(400).json(apiResponse.error(400, "계좌번호를 입력해주세요"));
        return;
      }

      // Try longest prefix first (4-digit, then 3-digit) for accuracy
      for (const len of [4, 3]) {
        if (digits.length < len) continue;
        const prefix = digits.substring(0, len);

        const match = await prisma.bankPrefix.findFirst({
          where: { prefix },
          include: {
            bank: { select: { bankCode: true, bankName: true } },
          },
        });

        if (match) {
          res.json(
            apiResponse.ok("은행 감지 성공", {
              bankCode: match.bank.bankCode,
              bankName: match.bank.bankName,
            })
          );
          return;
        }
      }

      res.status(404).json(apiResponse.error(404, "일치하는 은행을 찾을 수 없습니다"));
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/banks — 전체 은행 목록 조회
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const banks = await prisma.bank.findMany({
      select: { id: true, bankCode: true, bankName: true },
      orderBy: { bankName: "asc" },
    });
    res.json(apiResponse.ok("은행 목록 조회 성공", banks));
  } catch (err) {
    next(err);
  }
});

export default router;
