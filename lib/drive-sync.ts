// lib/drive-sync.ts — Sync Google Drive folder with DB
import { google, drive_v3 } from "googleapis";
import prisma from "@/lib/prisma";

export interface SyncResult {
  added: number;
  removed: number;
  updated: number;
  unchanged: number;
  errors: string[];
}

export type SyncProgress =
  | { type: "listing"; folder?: string; found?: number }
  | { type: "adding"; current: number; total: number }
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

const BATCH_SIZE = 500;

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

function driveUrl(fileId: string): string {
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
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
      pageSize: 1000,
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

export async function publishFile(drive: drive_v3.Drive, fileId: string): Promise<void> {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });
  } catch {
    // Already public or no permission needed — ignore
  }
}

export async function syncDrive(
  onProgress?: (p: SyncProgress) => void
): Promise<SyncResult> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID no configurado");

  const drive = getDriveClient();
  const result: SyncResult = { added: 0, removed: 0, updated: 0, unchanged: 0, errors: [] };

  // 1. List all files from Drive (pageSize: 1000 → ~10x menos llamadas)
  onProgress?.({ type: "listing", found: 0 });
  const driveFiles = await listAllFiles(drive, folderId, "", onProgress);
  const driveIds = new Set(driveFiles.map((f) => f.id));

  // 2. Get existing storagePaths from DB
  const dbFiles = await prisma.recordFile.findMany({
    select: { id: true, storagePath: true, name: true, size: true },
  });
  const dbIds = new Set(dbFiles.map((f) => f.storagePath));
  const dbFilesMap = new Map(dbFiles.map((f) => [f.storagePath, f]));

  // 3. Bulk insert new files — sin makePublic, URL directa del fileId
  const toAdd = driveFiles.filter((f) => !dbIds.has(f.id));
  for (let i = 0; i < toAdd.length; i += BATCH_SIZE) {
    const chunk = toAdd.slice(i, i + BATCH_SIZE);
    onProgress?.({ type: "adding", current: Math.min(i + BATCH_SIZE, toAdd.length), total: toAdd.length });
    try {
      const created = await prisma.recordFile.createMany({
        data: chunk.map((file) => ({
          recordId: null,
          name: file.name,
          url: driveUrl(file.id),
          storagePath: file.id,
          folderPath: file.folderPath,
          type: file.mimeType,
          size: file.size,
          aiMatch: false,
          aiConfidence: null,
        })),
        skipDuplicates: true,
      });
      result.added += created.count;
    } catch (err) {
      result.errors.push(`Batch ${i}–${i + BATCH_SIZE}: ${(err as Error).message}`);
    }
  }

  // 4. Bulk delete files removed from Drive
  const toRemove = dbFiles.filter((f) => !driveIds.has(f.storagePath));
  for (let i = 0; i < toRemove.length; i += BATCH_SIZE) {
    const chunk = toRemove.slice(i, i + BATCH_SIZE);
    onProgress?.({ type: "removing", current: Math.min(i + BATCH_SIZE, toRemove.length), total: toRemove.length });
    try {
      const deleted = await prisma.recordFile.deleteMany({
        where: { id: { in: chunk.map((f) => f.id) } },
      });
      result.removed += deleted.count;
    } catch (err) {
      result.errors.push(`Delete batch ${i}: ${(err as Error).message}`);
    }
  }

  // 5. Update files whose name or size changed
  const toUpdate = driveFiles.filter((f) => {
    const existing = dbFilesMap.get(f.id);
    return existing && (existing.name !== f.name || existing.size !== f.size);
  });
  for (const file of toUpdate) {
    try {
      await prisma.recordFile.updateMany({
        where: { storagePath: file.id },
        data: { name: file.name, size: file.size },
      });
      result.updated++;
    } catch (err) {
      result.errors.push(`Update ${file.id}: ${(err as Error).message}`);
    }
  }

  result.unchanged = driveFiles.length - toAdd.length - toUpdate.length;

  return result;
}
