import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export function getExtension(mimetype: string): string {
  if (mimetype === "image/png") return ".png";
  if (mimetype === "image/webp") return ".webp";
  return ".jpg";
}

// 업로드 파일명은 UUID 기반이라 내용이 절대 바뀌지 않음 → 영구 캐시 가능
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

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
  const originalKey = `${folder}/${crypto.randomUUID()}${getExtension(file.mimetype)}`;
  const [variants] = await Promise.all([
    uploadVariants(file.buffer, originalKey),
    putImage(originalKey, file.buffer, file.mimetype),
  ]);
  return { imageUrl: `${getBaseUrl()}/${originalKey}`, ...variants, originalKey };
}

// 원본 키({folder}/{uuid}.{ext}) 기준으로 display(1920px)·thumb(400px) JPEG/WebP 변형을 생성해 업로드
export async function uploadVariants(
  buffer: Buffer,
  originalKey: string,
): Promise<{
  displayUrl: string;
  displayWebpUrl: string;
  thumbnailUrl: string;
  thumbnailWebpUrl: string;
  width: number;
  height: number;
}> {
  const { folder, uuid } = parseOriginalKey(originalKey);
  const displayKey = `${folder}/display/${uuid}.jpg`;
  const displayWebpKey = `${folder}/display/${uuid}.webp`;
  const thumbKey = `${folder}/thumbs/${uuid}.jpg`;
  const thumbWebpKey = `${folder}/thumbs/${uuid}.webp`;

  // 웹 최적화 버전 생성 (최대 1920px, 품질 85) — 뷰어용
  const display = await resizeVariants(buffer, 1920, 1920, 85);
  // 썸네일 생성 (400px, 품질 80) — 그리드용
  const thumb = await resizeVariants(buffer, 400, undefined, 80);

  await Promise.all([
    putImage(displayKey, display.jpeg, "image/jpeg"),
    // generateWebp 기본값(true)으로 호출했으므로 webp는 항상 존재
    putImage(displayWebpKey, display.webp!, "image/webp"),
    putImage(thumbKey, thumb.jpeg, "image/jpeg"),
    putImage(thumbWebpKey, thumb.webp!, "image/webp"),
  ]);

  const baseUrl = getBaseUrl();
  return {
    displayUrl: `${baseUrl}/${displayKey}`,
    displayWebpUrl: `${baseUrl}/${displayWebpKey}`,
    thumbnailUrl: `${baseUrl}/${thumbKey}`,
    thumbnailWebpUrl: `${baseUrl}/${thumbWebpKey}`,
    width: display.width,
    height: display.height,
  };
}

function getBaseUrl(): string {
  return `https://${env.AWS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
}

function parseOriginalKey(originalKey: string): { folder: string; uuid: string } {
  const slash = originalKey.lastIndexOf("/");
  return {
    folder: originalKey.slice(0, slash),
    uuid: originalKey.slice(slash + 1).replace(/\.[^.]+$/, ""),
  };
}

// 원본 키에서 파생되는 변형 키 목록 (삭제용)
export function getVariantKeys(originalKey: string): string[] {
  const { folder, uuid } = parseOriginalKey(originalKey);
  return [
    `${folder}/display/${uuid}.jpg`,
    `${folder}/display/${uuid}.webp`,
    `${folder}/thumbs/${uuid}.jpg`,
    `${folder}/thumbs/${uuid}.webp`,
  ];
}

export function getObjectUrl(key: string): string {
  return `${getBaseUrl()}/${key}`;
}

// 브라우저 직접 업로드용 PUT URL — ContentType·ContentLength가 서명에 포함되어 다른 크기/타입은 S3가 거부
export async function createPresignedPutUrl(
  key: string,
  contentType: string,
  size: number,
  expiresIn: number,
): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: env.AWS_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
      CacheControl: IMMUTABLE_CACHE_CONTROL,
    }),
    { expiresIn, signableHeaders: new Set(["content-type", "content-length", "cache-control"]) },
  );
}

export async function headObject(
  key: string,
): Promise<{ size: number; contentType: string } | null> {
  try {
    const res = await s3.send(new HeadObjectCommand({ Bucket: env.AWS_BUCKET, Key: key }));
    return { size: res.ContentLength ?? 0, contentType: res.ContentType ?? "" };
  } catch (err) {
    if ((err as { name?: string }).name === "NotFound") return null;
    throw err;
  }
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
