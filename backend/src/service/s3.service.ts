import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import sharp from "sharp";
import { env } from "@/config/env";
import crypto from "crypto";

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY!,
    secretAccessKey: env.AWS_SECRET_KEY!,
  },
});

function getExtension(mimetype: string): string {
  if (mimetype === "image/png") return ".png";
  if (mimetype === "image/webp") return ".webp";
  return ".jpg";
}

export async function uploadImage(
  file: Express.Multer.File,
  folder = "images",
): Promise<string> {
  const key = `${folder}/${crypto.randomUUID()}${getExtension(file.mimetype)}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );
  return `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function uploadImageWithThumbnail(
  file: Express.Multer.File,
  folder = "galleries",
): Promise<{ imageUrl: string; thumbnailUrl: string; originalKey: string }> {
  const uuid = crypto.randomUUID();
  const ext = getExtension(file.mimetype);
  const originalKey = `${folder}/${uuid}${ext}`;
  const thumbKey = `${folder}/thumbs/${uuid}.jpg`;

  // 원본 업로드
  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_BUCKET,
      Key: originalKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  // 썸네일 생성 (400px 리사이즈)
  const thumbBuffer = await sharp(file.buffer)
    .resize(400, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_BUCKET,
      Key: thumbKey,
      Body: thumbBuffer,
      ContentType: "image/jpeg",
    }),
  );

  const baseUrl = `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
  return {
    imageUrl: `${baseUrl}/${originalKey}`,
    thumbnailUrl: `${baseUrl}/${thumbKey}`,
    originalKey,
  };
}

export async function deleteFile(url: string): Promise<void> {
  const key = new URL(url).pathname.slice(1);
  await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_BUCKET, Key: key }));
}

export async function deleteFileByKey(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_BUCKET, Key: key }));
}

export async function downloadFileBuffer(
  s3Key: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: env.AWS_BUCKET, Key: s3Key }),
  );
  const stream = res.Body as Readable;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return {
    buffer: Buffer.concat(chunks),
    contentType: res.ContentType ?? "image/jpeg",
  };
}
