import { google } from "googleapis";
import { Readable } from "node:stream";
import { env } from "@/config/env";

const folderCache = new Map<number, string>();

let _driveClient: ReturnType<typeof google.drive> | null = null;

function getDriveClient() {
  if (_driveClient) return _driveClient;
  const refreshToken = env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("GOOGLE_DRIVE_REFRESH_TOKEN is not set");

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  _driveClient = google.drive({ version: "v3", auth: oauth2Client });
  return _driveClient;
}

export async function getOrCreateWeddingFolder(weddingId: number): Promise<string> {
  const cached = folderCache.get(weddingId);
  if (cached) return cached;

  const drive = getDriveClient();
  const folderName = `wedding-${weddingId}`;
  const rootFolderId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

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

export async function uploadToDrive(
  file: { buffer: Buffer; mimetype: string; originalname: string },
  folderId: string,
): Promise<{ driveFileId: string }> {
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

  // 권한 설정은 응답과 무관하므로 비동기 처리
  drive.permissions.create({
    fileId: driveFileId,
    requestBody: { type: "anyone", role: "reader" },
    supportsAllDrives: true,
  }).catch(() => {});

  return { driveFileId };
}

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

export async function deleteFromDrive(driveFileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId: driveFileId, supportsAllDrives: true });
}
