import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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
  return mimetype === "image/png" ? ".png" : ".jpg";
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
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  const uuid = crypto.randomUUID();
  const ext = getExtension(file.mimetype);
  const originalKey = `galleries/${uuid}${ext}`;
  const thumbKey = `galleries/thumbs/${uuid}.jpg`;

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
  };
}

export async function deleteFile(url: string): Promise<void> {
  const key = new URL(url).pathname.slice(1);
  await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_BUCKET, Key: key }));
}
