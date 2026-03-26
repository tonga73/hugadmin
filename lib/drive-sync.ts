// lib/drive-sync.ts — Sync Google Drive folder with DB
import { google, drive_v3 } from "googleapis";
import prisma from "@/lib/prisma";

export interface SyncResult {
  added: number;
  removed: number;
  unchanged: number;
  errors: string[];
}

export type SyncProgress =
  | { type: "listing"; folder?: string; found?: number }
  | { type: "adding"; current: number; total: number; name: string }
  | { type: "removing"; current: number; total: number };

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  folderPath: string;
}

const SUPPORTED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
]);

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

async function listAllFiles(
  drive: drive_v3.Drive,
  folderId: string,
  currentPath = "",
  onProgress?: (p: SyncProgress) => void,
  counter = { found: 0 }
): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, size)",
      pageSize: 100,
      ...(pageToken ? { pageToken } : {}),
    });

    for (const item of res.data.files ?? []) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        const subPath = currentPath ? `${currentPath}/${item.name}` : item.name!;
        onProgress?.({ type: "listing", folder: subPath, found: counter.found });
        const subFiles = await listAllFiles(drive, item.id!, subPath, onProgress, counter);
        files.push(...subFiles);
      } else if (SUPPORTED_MIMES.has(item.mimeType ?? "")) {
        counter.found++;
        files.push({
          id: item.id!,
          name: item.name!,
          mimeType: item.mimeType!,
          size: parseInt(item.size ?? "0"),
          folderPath: currentPath,
        });
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

async function makePublic(drive: drive_v3.Drive, fileId: string): Promise<string> {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });
  } catch {
    // Already public — ignore
  }
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

export async function syncDrive(
  onProgress?: (p: SyncProgress) => void
): Promise<SyncResult> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID no configurado");

  const drive = getDriveClient();
  const result: SyncResult = { added: 0, removed: 0, unchanged: 0, errors: [] };

  // 1. Get all files from Drive
  onProgress?.({ type: "listing", found: 0 });
  const driveFiles = await listAllFiles(drive, folderId, "", onProgress);
  const driveIds = new Set(driveFiles.map((f) => f.id));

  // 2. Get all files from DB
  const dbFiles = await prisma.recordFile.findMany({
    select: { id: true, storagePath: true },
  });
  const dbIds = new Set(dbFiles.map((f) => f.storagePath));

  // 3. Add new files (in Drive but not in DB)
  const toAdd = driveFiles.filter((f) => !dbIds.has(f.id));
  for (let i = 0; i < toAdd.length; i++) {
    const file = toAdd[i];
    onProgress?.({ type: "adding", current: i + 1, total: toAdd.length, name: file.name });
    try {
      const url = await makePublic(drive, file.id);
      await prisma.recordFile.create({
        data: {
          recordId: null,
          name: file.name,
          url,
          storagePath: file.id,
          folderPath: file.folderPath,
          type: file.mimeType,
          size: file.size,
          aiMatch: false,
          aiConfidence: null,
        },
      });
      result.added++;
    } catch (err) {
      result.errors.push(`Add ${file.name}: ${(err as Error).message}`);
    }
  }

  // 4. Remove files deleted from Drive (in DB but not in Drive)
  const toRemove = dbFiles.filter((f) => !driveIds.has(f.storagePath));
  for (let i = 0; i < toRemove.length; i++) {
    onProgress?.({ type: "removing", current: i + 1, total: toRemove.length });
    const file = toRemove[i];
    try {
      await prisma.recordFile.delete({ where: { id: file.id } });
      result.removed++;
    } catch (err) {
      result.errors.push(`Remove id ${file.id}: ${(err as Error).message}`);
    }
  }

  result.unchanged = driveFiles.length - toAdd.length;

  return result;
}
