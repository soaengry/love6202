import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "@/config/env";

export interface DriveSyncJobData {
  uploadId: number;
  s3Key: string;
  originalName: string;
  /** Drive 저장 파일명 — 미지정 시(배포 전 큐잉된 잡) `{timestamp}-{originalName}` */
  fileName?: string;
  mimeType: string;
  weddingId: number;
}

export interface ImageProcessJobData {
  uploadId: number;
  s3Key: string;
  mimeType: string;
  weddingId: number;
  /** 검증·변환 성공 후 drive-sync 잡에 넘길 Drive 파일명 */
  driveFileName: string;
}

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
connection.on("error", (err) => {
  console.warn("[DriveSync] Redis connection error:", err.message);
});

export const driveSyncQueue = new Queue<DriveSyncJobData>("drive-sync", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
driveSyncQueue.on("error", (err) => {
  console.warn("[DriveSync] Queue error:", err.message);
});

// 브라우저가 S3에 직접 올린 원본의 검증·썸네일 생성 (동시성은 워커에서 제한)
export const imageProcessQueue = new Queue<ImageProcessJobData>("image-process", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
imageProcessQueue.on("error", (err) => {
  console.warn("[ImageProcess] Queue error:", err.message);
});
