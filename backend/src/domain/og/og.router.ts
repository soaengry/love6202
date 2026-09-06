import { Router, Request, Response } from "express";
import prisma from "@/prisma";
import { env } from "@/config/env";
import * as weddingService from "@/domain/wedding/wedding.service";

const router = Router();

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (c) => entities[c]!);
}

async function resolveOgImage(weddingId: number, heroImageUrl?: string): Promise<string> {
  if (heroImageUrl) return heroImageUrl;

  const firstGalleryPhoto = await prisma.gallery.findFirst({
    where: { weddingId },
    orderBy: { orderIndex: "asc" },
  });
  return firstGalleryPhoto?.imageUrl ?? `${env.FRONTEND_URL}/logo.png`;
}

function renderOgHtml(params: {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
}): string {
  const { title, description, imageUrl, pageUrl } = params;
  return `<!doctype html>
<html lang="ko"><head>
<meta charset="UTF-8" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(imageUrl)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta property="og:type" content="website" />
<title>${escapeHtml(title)}</title>
</head><body></body></html>`;
}

// GET /api/og, /api/og/:weddingId — 카카오톡 등 링크 미리보기 크롤러 전용 OG 태그 응답
async function handleOgRequest(req: Request, res: Response): Promise<void> {
  const parsedId = req.params.weddingId ? Number(req.params.weddingId) : NaN;

  const wedding = await (Number.isInteger(parsedId)
    ? weddingService.getWedding(parsedId)
    : weddingService.getLatestWedding()
  ).catch(() => null);

  if (!wedding) {
    res.type("html").send(
      renderOgHtml({
        title: "LOVE6202 — 디지털 웨딩 초대장",
        description: "나만의 청첩장을 만들고 하객을 초대하세요.",
        imageUrl: `${env.FRONTEND_URL}/logo.png`,
        pageUrl: env.FRONTEND_URL,
      }),
    );
    return;
  }

  const groom = wedding.couples.find((c) => c.role === "GROOM");
  const bride = wedding.couples.find((c) => c.role === "BRIDE");
  const title = groom && bride ? `${groom.name} ♥ ${bride.name} 결혼합니다` : wedding.wedding.title;

  const imageUrl = await resolveOgImage(wedding.wedding.id, wedding.heroImages[0]?.imageUrl);

  res.type("html").send(
    renderOgHtml({
      title,
      description: wedding.wedding.greeting?.slice(0, 100) || "모바일 청첩장에 초대합니다.",
      imageUrl,
      pageUrl: `${env.FRONTEND_URL}/${wedding.wedding.id}`,
    }),
  );
}

router.get("/", handleOgRequest);
router.get("/:weddingId", handleOgRequest);

export default router;
