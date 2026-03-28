import { google } from "googleapis";
import { Readable } from "node:stream";
import { env } from "@/config/env";

// 웨딩별 폴더 ID 캐시
const folderCache = new Map<number, string>();

function getDriveClient() {
  const refreshToken = env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("GOOGLE_DRIVE_REFRESH_TOKEN is not set");

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.drive({ version: "v3", auth: oauth2Client });
}

/**
 * 웨딩별 폴더를 가져오거나 새로 생성
 */
export async function getOrCreateWeddingFolder(weddingId: number): Promise<string> {
  const cached = folderCache.get(weddingId);
  if (cached) return cached;

  const drive = getDriveClient();
  const folderName = `wedding-${weddingId}`;
  const rootFolderId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  // 기존 폴더 검색
  const query = rootFolderId
    ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const list = await drive.files.list({
    q: query,
    fields: "files(id)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (list.data.files && list.data.files.length > 0) {
    const folderId = list.data.files[0].id!;
    folderCache.set(weddingId, folderId);
    return folderId;
  }

  // 새 폴더 생성
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      ...(rootFolderId ? { parents: [rootFolderId] } : {}),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const folderId = folder.data.id!;
  folderCache.set(weddingId, folderId);
  return folderId;
}

/**
 * Google Drive에 파일 업로드 + 공개 읽기 권한 부여
 */
export async function uploadToDrive(
  file: Express.Multer.File,
  folderId: string,
): Promise<{ driveFileId: string; imageUrl: string }> {
  const drive = getDriveClient();

  const res = await drive.files.create({
    requestBody: {
      name: `${Date.now()}-${file.originalname}`,
      parents: [folderId],
    },
    media: {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  const driveFileId = res.data.id!;

  // 공개 읽기 권한 부여
  await drive.permissions.create({
    fileId: driveFileId,
    requestBody: { type: "anyone", role: "reader" },
    supportsAllDrives: true,
  });

  const imageUrl = `/api/uploads/image/${driveFileId}`;

  return { driveFileId, imageUrl };
}

/**
 * Google Drive에서 파일 스트리밍 (이미지 프록시용)
 */
export async function streamFromDrive(driveFileId: string) {
  const drive = getDriveClient();

  const meta = await drive.files.get({
    fileId: driveFileId,
    fields: "mimeType",
    supportsAllDrives: true,
  });

  const res = await drive.files.get(
    { fileId: driveFileId, alt: "media", supportsAllDrives: true },
    { responseType: "arraybuffer" },
  );

  return { data: Buffer.from(res.data as ArrayBuffer), mimeType: meta.data.mimeType! };
}

/**
 * Google Drive에서 파일 삭제
 */
export async function deleteFromDrive(driveFileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId: driveFileId, supportsAllDrives: true });
}
