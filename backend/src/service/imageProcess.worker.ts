import { Worker } from "bullmq";
import Redis from "ioredis";
import sharp from "sharp";
import { env } from "@/config/env";
import { driveSyncQueue, type ImageProcessJobData } from "@/config/queue";
import { downloadFileBuffer, uploadVariants, deleteFileByKey, getVariantKeys } from "@/service/s3.service";
import { isValidImageBuffer } from "@/middleware/upload";
import prisma from "@/prisma";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
connection.on("error", (err) => {
  console.warn("[ImageProcess] Worker Redis connection error:", err.message);
});

async function isDecodableImage(buffer: Buffer): Promise<boolean> {
  if (!isValidImageBuffer(buffer)) return false;
  try {
    await sharp(buffer).metadata();
    return true;
  } catch {
    return false;
  }
}

function deleteKeys(keys: string[]): Promise<void[]> {
  return Promise.all(keys.map((key) => deleteFileByKey(key).catch(() => {})));
}

export const imageProcessWorker = new Worker<ImageProcessJobData>(
  "image-process",
  async (job) => {
    const { uploadId, s3Key, mimeType, weddingId, driveFileName } = job.data;

    const { buffer } = await downloadFileBuffer(s3Key);

    // 확장자·Content-Type 위장 파일 → 원본과 DB row 제거
    if (!(await isDecodableImage(buffer))) {
      console.warn(`[ImageProcess] 유효하지 않은 이미지 제거: uploadId=${uploadId} key=${s3Key}`);
      await deleteKeys([s3Key]);
      await prisma.upload.deleteMany({ where: { id: uploadId } });
      return;
    }

    const { thumbnailUrl } = await uploadVariants(buffer, s3Key);

    // 처리 중 사용자가 삭제했다면 방금 만든 변형도 정리
    const { count } = await prisma.upload.updateMany({
      where: { id: uploadId },
      data: { thumbnailUrl },
    });
    if (count === 0) {
      await deleteKeys(getVariantKeys(s3Key));
      return;
    }

    await driveSyncQueue.add(
      "sync",
      { uploadId, s3Key, originalName: driveFileName, fileName: driveFileName, mimeType, weddingId },
      { jobId: `upload-${uploadId}` },
    );
  },
  {
    connection,
    // sharp 디코딩 메모리 피크를 제한 (원본 1장 ≈ 수십 MB)
    concurrency: 2,
  },
);
imageProcessWorker.on("error", (err) => {
  console.warn("[ImageProcess] Worker error:", err.message);
});
