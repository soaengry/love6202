import { describe, it, expect, vi, beforeEach } from "vitest";

const SESSION = "11111111-1111-1111-1111-111111111111";
const KEY_A = "user-uploads/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg";
const KEY_B = "user-uploads/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png";

const prismaMock = {
  wedding: { findUnique: vi.fn() },
  upload: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
  $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
};
const redisMock = { setex: vi.fn(), mget: vi.fn(), del: vi.fn() };
const s3Mock = {
  createPresignedPutUrl: vi.fn(async (key: string) => `https://s3.example/${key}?sig`),
  headObject: vi.fn(),
  deleteFileByKey: vi.fn(async () => {}),
  getExtension: (mime: string) => (mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg"),
  getObjectUrl: (key: string) => `https://bucket/${key}`,
  getVariantKeys: (key: string) => [`${key}.display`, `${key}.thumb`],
  IMMUTABLE_CACHE_CONTROL: "public, max-age=31536000, immutable",
};
const imageProcessQueue = { add: vi.fn(async () => {}), getJob: vi.fn() };
const driveSyncQueue = { getJob: vi.fn() };

vi.mock("@/prisma", () => ({ default: prismaMock }));
vi.mock("@/config/redis", () => ({ default: redisMock }));
vi.mock("@/service/s3.service", () => s3Mock);
vi.mock("@/config/queue", () => ({ imageProcessQueue, driveSyncQueue }));
vi.mock("@/service/googleDrive.service", () => ({ deleteFromDrive: vi.fn(async () => {}) }));

const uploadService = await import("@/domain/upload/upload.service");

const issued = (sessionId = SESSION, weddingId = 1) => JSON.stringify({ sessionId, weddingId });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createPresignedUploads", () => {
  it("파일별 PUT URL을 발급하고 세션·웨딩 정보를 Redis에 저장한다", async () => {
    prismaMock.wedding.findUnique.mockResolvedValue({ id: 1 });

    const result = await uploadService.createPresignedUploads(SESSION, 1, [
      { contentType: "image/jpeg", size: 1000 },
      { contentType: "image/png", size: 2000 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].key).toMatch(/^user-uploads\/[0-9a-f-]{36}\.jpg$/);
    expect(result[1].key).toMatch(/\.png$/);
    expect(result[1].headers).toEqual({ "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" });
    expect(s3Mock.createPresignedPutUrl).toHaveBeenCalledWith(result[1].key, "image/png", 2000, 600);
    expect(redisMock.setex).toHaveBeenCalledWith(`upload:presign:${result[0].key}`, 900, issued());
  });

  it("웨딩이 없으면 404", async () => {
    prismaMock.wedding.findUnique.mockResolvedValue(null);

    await expect(
      uploadService.createPresignedUploads(SESSION, 1, [{ contentType: "image/jpeg", size: 1 }]),
    ).rejects.toMatchObject({ code: "UPLOAD_WEDDING_NOT_FOUND" });
  });
});

describe("completeUploads", () => {
  it("발급된 키를 등록하고 썸네일 생성 잡을 큐잉한다", async () => {
    redisMock.mget.mockResolvedValue([issued(), issued()]);
    redisMock.del.mockResolvedValue(2);
    s3Mock.headObject.mockResolvedValue({ size: 1000, contentType: "image/jpeg" });
    prismaMock.upload.create.mockImplementation(async ({ data }) => ({
      id: data.s3Key === KEY_A ? 10 : 11,
      ...data,
      driveFileId: null,
      createdAt: new Date(),
    }));

    const result = await uploadService.completeUploads(SESSION, 42, 1, [KEY_A, KEY_B]);

    expect(result.map((r) => r.id)).toEqual([10, 11]);
    expect(prismaMock.upload.create).toHaveBeenCalledWith({
      data: { weddingId: 1, sessionId: SESSION, userId: 42, imageUrl: `https://bucket/${KEY_A}`, thumbnailUrl: null, s3Key: KEY_A },
    });
    expect(imageProcessQueue.add).toHaveBeenCalledWith(
      "process",
      expect.objectContaining({
        uploadId: 11,
        s3Key: KEY_B,
        mimeType: "image/png",
        driveFileName: expect.stringMatching(/^u42-\d{8}-\d{6}-02\.png$/),
      }),
      { jobId: "upload-11" },
    );
  });

  it("다른 세션으로 발급된 키는 거부한다", async () => {
    redisMock.mget.mockResolvedValue([issued("other-session")]);

    await expect(uploadService.completeUploads(SESSION, undefined, 1, [KEY_A])).rejects.toMatchObject({
      code: "UPLOAD_INVALID_KEY",
    });
    expect(prismaMock.upload.create).not.toHaveBeenCalled();
  });

  it("발급 이력이 없거나 만료된 키는 거부한다", async () => {
    redisMock.mget.mockResolvedValue([null]);

    await expect(uploadService.completeUploads(SESSION, undefined, 1, [KEY_A])).rejects.toMatchObject({
      code: "UPLOAD_INVALID_KEY",
    });
  });

  it("S3에 파일이 없으면 거부하고 발급 정보를 소진하지 않는다", async () => {
    redisMock.mget.mockResolvedValue([issued()]);
    s3Mock.headObject.mockResolvedValue(null);

    await expect(uploadService.completeUploads(SESSION, undefined, 1, [KEY_A])).rejects.toMatchObject({
      code: "UPLOAD_FILE_NOT_FOUND",
    });
    expect(redisMock.del).not.toHaveBeenCalled();
  });

  it("동시 요청으로 이미 소진된 키면 거부한다", async () => {
    redisMock.mget.mockResolvedValue([issued()]);
    s3Mock.headObject.mockResolvedValue({ size: 1000, contentType: "image/jpeg" });
    redisMock.del.mockResolvedValue(0);

    await expect(uploadService.completeUploads(SESSION, undefined, 1, [KEY_A])).rejects.toMatchObject({
      code: "UPLOAD_INVALID_KEY",
    });
    expect(prismaMock.upload.create).not.toHaveBeenCalled();
  });
});

describe("deleteUpload", () => {
  it("원본·변형을 삭제하고 대기 중인 잡을 취소한다", async () => {
    const remove = vi.fn(async () => {});
    prismaMock.upload.findUnique.mockResolvedValue({ id: 10, sessionId: SESSION, userId: null, s3Key: KEY_A, driveFileId: null });
    imageProcessQueue.getJob.mockResolvedValue({ remove });
    driveSyncQueue.getJob.mockResolvedValue(null);

    await uploadService.deleteUpload(SESSION, undefined, undefined, 10);

    expect(s3Mock.deleteFileByKey).toHaveBeenCalledWith(KEY_A);
    expect(s3Mock.deleteFileByKey).toHaveBeenCalledWith(`${KEY_A}.thumb`);
    expect(remove).toHaveBeenCalled();
    expect(prismaMock.upload.delete).toHaveBeenCalledWith({ where: { id: 10 } });
  });
});
