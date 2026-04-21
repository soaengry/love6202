import { Worker } from "bullmq";
import Redis from "ioredis";
import { env } from "@/config/env";
import type { DriveSyncJobData } from "@/config/queue";
import { downloadFileBuffer } from "@/service/s3.service";
import { getOrCreateWeddingFolder, uploadToDrive } from "@/service/googleDrive.service";
import prisma from "@/prisma";

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const driveSyncWorker = new Worker<DriveSyncJobData>(
  "drive-sync",
  async (job) => {
    const { uploadId, s3Key, originalName, mimeType, weddingId } = job.data;

    const { buffer, contentType } = await downloadFileBuffer(s3Key);
    const folderId = await getOrCreateWeddingFolder(weddingId);
    const { driveFileId } = await uploadToDrive(
      { buffer, mimetype: mimeType || contentType, originalname: originalName },
      folderId,
    );

    await prisma.upload.update({
      where: { id: uploadId },
      data: { driveFileId, driveSyncedAt: new Date() },
    });
  },
  {
    connection,
    concurrency: 3,
  },
);
