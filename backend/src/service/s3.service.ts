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

// 업로드 파일명은 UUID 기반이라 내용이 절대 바뀌지 않음 → 영구 캐시 가능
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

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
      CacheControl: IMMUTABLE_CACHE_CONTROL,
    }),
  );
  return `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
}

type ResizedVariants = {
  jpeg: Buffer;
  webp: Buffer | null;
  width: number;
  height: number;
};

// 리사이즈 파이프라인 1회 구성 후 JPEG(+WebP) 포맷으로 인코딩.
// webp 사본을 저장할 DB 컬럼이 없는 호출부(예: 프로필 이미지)는 orphan 파일을 막기 위해 생성하지 않는다.
async function resizeVariants(
  buffer: Buffer,
  maxWidth: number,
  maxHeight: number | undefined,
  quality: number,
  generateWebp = true,
): Promise<ResizedVariants> {
  const pipeline = sharp(buffer).resize(maxWidth, maxHeight, {
    fit: "inside",
    withoutEnlargement: true,
  });

  const [jpegResult, webp] = await Promise.all([
    pipeline.clone().jpeg({ quality }).toBuffer({ resolveWithObject: true }),
    generateWebp ? pipeline.clone().webp({ quality }).toBuffer() : Promise.resolve(null),
  ]);

  return {
    jpeg: jpegResult.data,
    webp,
    width: jpegResult.info.width,
    height: jpegResult.info.height,
  };
}

async function putImage(key: string, body: Buffer, contentType: string): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.AWS_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: IMMUTABLE_CACHE_CONTROL,
    }),
  );
}

export async function uploadOptimizedImage(
  file: Express.Multer.File,
  folder: string,
  maxSize: number,
  quality = 85,
  generateWebp = true,
): Promise<{ url: string; webpUrl: string | null; width: number; height: number }> {
  const uuid = crypto.randomUUID();
  const jpegKey = `${folder}/${uuid}.jpg`;
  const webpKey = `${folder}/${uuid}.webp`;

  const { jpeg, webp, width, height } = await resizeVariants(
    file.buffer,
    maxSize,
    maxSize,
    quality,
    generateWebp,
  );

  await Promise.all([
    putImage(jpegKey, jpeg, "image/jpeg"),
    webp ? putImage(webpKey, webp, "image/webp") : Promise.resolve(),
  ]);

  const baseUrl = `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
  return {
    url: `${baseUrl}/${jpegKey}`,
    webpUrl: webp ? `${baseUrl}/${webpKey}` : null,
    width,
    height,
  };
}

export async function uploadImageWithThumbnail(
  file: Express.Multer.File,
  folder = "galleries",
): Promise<{
  imageUrl: string;
  displayUrl: string;
  displayWebpUrl: string;
  thumbnailUrl: string;
  thumbnailWebpUrl: string;
  width: number;
  height: number;
  originalKey: string;
}> {
  const uuid = crypto.randomUUID();
  const ext = getExtension(file.mimetype);
  const originalKey = `${folder}/${uuid}${ext}`;
  const displayKey = `${folder}/display/${uuid}.jpg`;
  const displayWebpKey = `${folder}/display/${uuid}.webp`;
  const thumbKey = `${folder}/thumbs/${uuid}.jpg`;
  const thumbWebpKey = `${folder}/thumbs/${uuid}.webp`;

  // 웹 최적화 버전 생성 (최대 1920px, 품질 85) — 뷰어용
  const display = await resizeVariants(file.buffer, 1920, 1920, 85);
  // 썸네일 생성 (400px, 품질 80) — 그리드용
  const thumb = await resizeVariants(file.buffer, 400, undefined, 80);

  await Promise.all([
    // 원본 업로드
    putImage(originalKey, file.buffer, file.mimetype),
    putImage(displayKey, display.jpeg, "image/jpeg"),
    // generateWebp 기본값(true)으로 호출했으므로 webp는 항상 존재
    putImage(displayWebpKey, display.webp!, "image/webp"),
    putImage(thumbKey, thumb.jpeg, "image/jpeg"),
    putImage(thumbWebpKey, thumb.webp!, "image/webp"),
  ]);

  const baseUrl = `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
  return {
    imageUrl: `${baseUrl}/${originalKey}`,
    displayUrl: `${baseUrl}/${displayKey}`,
    displayWebpUrl: `${baseUrl}/${displayWebpKey}`,
    thumbnailUrl: `${baseUrl}/${thumbKey}`,
    thumbnailWebpUrl: `${baseUrl}/${thumbWebpKey}`,
    width: display.width,
    height: display.height,
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
