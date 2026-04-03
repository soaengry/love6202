import prisma from "@/prisma";
import { AppError } from "@/util/appError";
import { uploadImageWithThumbnail, deleteFile } from "@/service/s3.service";
import { paginate } from "@/util/pagination";
import { GalleryErrorCode } from "./gallery.error";
import { toGalleryResponse, type GalleryListResponse, type GalleryResponse } from "./gallery.types";

// ─── Upload ─────────────────────────────────────────────

export async function uploadImages(
  userId: number,
  files: Express.Multer.File[],
): Promise<GalleryResponse[]> {
  if (files.length > 20) {
    throw AppError.from(GalleryErrorCode.GALLERY_UPLOAD_LIMIT_EXCEEDED);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.weddingId) {
    throw AppError.from(GalleryErrorCode.GALLERY_WEDDING_NOT_FOUND);
  }

  const weddingId = user.weddingId;

  // 현재 최대 orderIndex 조회
  const maxOrder = await prisma.gallery.aggregate({
    where: { weddingId },
    _max: { orderIndex: true },
  });
  let nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

  // S3 업로드 (원본 + 썸네일)
  const uploadResults = await Promise.all(
    files.map((file) => uploadImageWithThumbnail(file)),
  );

  // DB 저장
  const galleries = await prisma.$transaction(
    uploadResults.map(({ imageUrl, thumbnailUrl }, i) =>
      prisma.gallery.create({
        data: {
          weddingId,
          imageUrl,
          thumbnailUrl,
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
  ids: number[],
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.weddingId) {
    throw AppError.from(GalleryErrorCode.GALLERY_WEDDING_NOT_FOUND);
  }

  const galleries = await prisma.gallery.findMany({
    where: { id: { in: ids }, weddingId: user.weddingId },
  });

  if (galleries.length === 0) {
    throw AppError.from(GalleryErrorCode.GALLERY_NOT_FOUND);
  }

  // S3 파일 삭제
  const deletePromises = galleries.flatMap((g) => {
    const tasks = [deleteFile(g.imageUrl)];
    if (g.thumbnailUrl) tasks.push(deleteFile(g.thumbnailUrl));
    return tasks;
  });
  await Promise.allSettled(deletePromises);

  // DB 삭제
  await prisma.gallery.deleteMany({
    where: { id: { in: galleries.map((g) => g.id) } },
  });
}
