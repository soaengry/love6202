import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import { uploadImageWithThumbnail, deleteFile } from "@/service/s3.service";
import { paginate } from "@/util/pagination";
import { GalleryErrorCode } from "./gallery.error";
import { toGalleryResponse, type GalleryListResponse, type GalleryResponse } from "./gallery.types";

// ─── Upload ─────────────────────────────────────────────

export async function uploadImages(
  userId: number,
  userRole: string,
  files: Express.Multer.File[],
  bodyWeddingId?: number,
): Promise<GalleryResponse[]> {
  if (files.length > 20) {
    throw AppError.from(GalleryErrorCode.GALLERY_UPLOAD_LIMIT_EXCEEDED);
  }

  let weddingId: number;

  if (userRole === "ADMIN") {
    if (!bodyWeddingId) {
      throw AppError.from(GalleryErrorCode.GALLERY_WEDDING_NOT_FOUND);
    }
    weddingId = bodyWeddingId;
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.weddingId) {
      throw AppError.from(GalleryErrorCode.GALLERY_WEDDING_NOT_FOUND);
    }
    weddingId = user.weddingId;
  }

  // 현재 최대 orderIndex 조회
  const maxOrder = await prisma.gallery.aggregate({
    where: { weddingId },
    _max: { orderIndex: true },
  });
  let nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

  // S3 업로드 (원본 + 웹최적화 + 썸네일, 각각 JPEG/WebP) — 순차 처리로 메모리 peak 제한
  const uploadResults: Awaited<ReturnType<typeof uploadImageWithThumbnail>>[] = [];
  for (const file of files) {
    uploadResults.push(await uploadImageWithThumbnail(file));
  }

  // DB 저장
  const galleries = await prisma.$transaction(
    uploadResults.map(
      ({ imageUrl, displayUrl, displayWebpUrl, thumbnailUrl, thumbnailWebpUrl, width, height }, i) =>
        prisma.gallery.create({
          data: {
            weddingId,
            imageUrl,
            displayUrl,
            displayWebpUrl,
            thumbnailUrl,
            thumbnailWebpUrl,
            width,
            height,
            orderIndex: nextOrder + i,
          },
        }),
    ),
  );

  return galleries.map(toGalleryResponse);
}

// ─── List ───────────────────────────────────────────────

export async function getGalleries(
  weddingId: number,
  page: number,
  size: number,
): Promise<GalleryListResponse> {
  const { skip, take } = paginate({ page, size });

  const [items, totalCount] = await Promise.all([
    prisma.gallery.findMany({
      where: { weddingId },
      orderBy: { orderIndex: "desc" },
      skip,
      take,
    }),
    prisma.gallery.count({ where: { weddingId } }),
  ]);

  return {
    items: items.map(toGalleryResponse),
    totalCount,
    page,
    size,
    hasNext: skip + take < totalCount,
  };
}

// ─── Delete ─────────────────────────────────────────────

export async function deleteGalleries(
  userId: number,
  userRole: string,
  ids: number[],
): Promise<void> {
  let galleries: {
    id: number;
    imageUrl: string;
    displayUrl: string | null;
    displayWebpUrl: string | null;
    thumbnailUrl: string | null;
    thumbnailWebpUrl: string | null;
  }[];

  if (userRole === "ADMIN") {
    galleries = await prisma.gallery.findMany({
      where: { id: { in: ids } },
    });
  } else {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.weddingId) {
      throw AppError.from(GalleryErrorCode.GALLERY_WEDDING_NOT_FOUND);
    }
    galleries = await prisma.gallery.findMany({
      where: { id: { in: ids }, weddingId: user.weddingId },
    });
  }

  if (galleries.length === 0) {
    throw AppError.from(GalleryErrorCode.GALLERY_NOT_FOUND);
  }

  // S3 파일 삭제 (원본 + display/thumbnail의 JPEG·WebP 사본 전부)
  const deletePromises = galleries.flatMap((g) =>
    [g.imageUrl, g.displayUrl, g.displayWebpUrl, g.thumbnailUrl, g.thumbnailWebpUrl]
      .filter((url): url is string => !!url)
      .map(deleteFile),
  );
  await Promise.allSettled(deletePromises);

  // DB 삭제
  await prisma.gallery.deleteMany({
    where: { id: { in: galleries.map((g) => g.id) } },
  });
}
