import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "@/config/env";

export interface DriveSyncJobData {
  uploadId: number;
  s3Key: string;
  originalName: string;
  mimeType: string;
  weddingId: number;
}

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const driveSyncQueue = new Queue<DriveSyncJobData>("drive-sync", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
