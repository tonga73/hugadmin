// lib/drive-sync.ts — Sync Google Drive folder with DB
import { drive_v3 } from "googleapis";
import prisma from "@/lib/prisma";
import { getDriveClient } from "@/lib/drive-client";

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
  // Native Google Workspace formats
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation",
]);

const GOOGLE_NATIVE_URLS: Record<string, (id: string) => string> = {
  "application/vnd.google-apps.document":     (id) => `https://docs.google.com/document/d/${id}/edit`,
  "application/vnd.google-apps.spreadsheet":  (id) => `https://docs.google.com/spreadsheets/d/${id}/edit`,
  "application/vnd.google-apps.presentation": (id) => `https://docs.google.com/presentation/d/${id}/edit`,
};

const BATCH_SIZE = 500;

export function driveUrl(fileId: string, mimeType: string): string {
  const nativeUrl = GOOGLE_NATIVE_URLS[mimeType];
  if (nativeUrl) return nativeUrl(fileId);
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

function categoryFromPath(folderPath: string): "DRIVE" | "APARTADO" | "EXPEDIENTE" {
  if (folderPath.includes("Apartados")) return "APARTADO";
  if (folderPath.includes("Expediente Unificado")) return "EXPEDIENTE";
  return "DRIVE";
}

// In-memory cache for folder names (avoids repeated API calls during incremental sync)
const folderNameCache = new Map<string, string>();

async function getFolderName(drive: drive_v3.Drive, folderId: string): Promise<string> {
  if (folderNameCache.has(folderId)) return folderNameCache.get(folderId)!;
  try {
    const res = await drive.files.get({ fileId: folderId, fields: "name" });
    const name = res.data.name ?? "";
    folderNameCache.set(folderId, name);
    return name;
  } catch {
    return "";
  }
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

// ─── Full sync ────────────────────────────────────────────────────────────────

export async function syncDrive(
  onProgress?: (p: SyncProgress) => void
): Promise<SyncResult> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) throw new Error("GOOGLE_DRIVE_FOLDER_ID no configurado");

  const drive = getDriveClient();
  const result: SyncResult = { added: 0, removed: 0, updated: 0, unchanged: 0, errors: [] };

  // 1. List all files from Drive
  onProgress?.({ type: "listing", found: 0 });
  const driveFiles = await listAllFiles(drive, folderId, "", onProgress);
  const driveIds = new Set(driveFiles.map((f) => f.id));

  // 2. Get existing storagePaths from DB
  const dbFiles = await prisma.recordFile.findMany({
    select: { id: true, storagePath: true, name: true, size: true },
  });
  const dbIds = new Set(dbFiles.map((f) => f.storagePath));
  const dbFilesMap = new Map(dbFiles.map((f) => [f.storagePath, f]));

  // 3. Bulk insert new files
  const toAdd = driveFiles.filter((f) => !dbIds.has(f.id));
  for (let i = 0; i < toAdd.length; i += BATCH_SIZE) {
    const chunk = toAdd.slice(i, i + BATCH_SIZE);
    onProgress?.({ type: "adding", current: Math.min(i + BATCH_SIZE, toAdd.length), total: toAdd.length });
    try {
      const created = await prisma.recordFile.createMany({
        data: chunk.map((file) => ({
          recordId: null,
          name: file.name,
          url: driveUrl(file.id, file.mimeType),
          storagePath: file.id,
          folderPath: file.folderPath,
          type: file.mimeType,
          size: file.size,
          category: categoryFromPath(file.folderPath),
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
  for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      chunk.map((file) =>
        prisma.recordFile.updateMany({
          where: { storagePath: file.id },
          data: { name: file.name, size: file.size },
        })
      )
    );
    result.updated += results.filter((r) => r.status === "fulfilled").length;
    results
      .filter((r) => r.status === "rejected")
      .forEach((r, idx) =>
        result.errors.push(`Update ${chunk[idx].id}: ${(r as PromiseRejectedResult).reason}`)
      );
  }

  result.unchanged = driveFiles.length - toAdd.length - toUpdate.length;

  // After a full sync, refresh the page token so incremental sync starts from now
  await refreshPageToken();

  return result;
}

// ─── Incremental sync (used by webhook) ──────────────────────────────────────

export async function syncDriveIncremental(): Promise<SyncResult> {
  const drive = getDriveClient();
  const result: SyncResult = { added: 0, removed: 0, updated: 0, unchanged: 0, errors: [] };

  const config = await prisma.config.findUnique({ where: { key: "drive_page_token" } });
  if (!config?.value) {
    // No saved token — fall back to full sync
    return syncDrive();
  }

  let currentToken = config.value;

  try {
    while (true) {
      const res = await drive.changes.list({
        pageToken: currentToken,
        fields:
          "nextPageToken, newStartPageToken, changes(fileId, removed, file(id, name, mimeType, size, parents, trashed))",
        spaces: "drive",
        pageSize: 100,
        includeItemsFromAllDrives: false,
        supportsAllDrives: false,
      });

      for (const change of res.data.changes ?? []) {
        const fileId = change.fileId!;

        if (change.removed || change.file?.trashed) {
          const deleted = await prisma.recordFile.deleteMany({ where: { storagePath: fileId } });
          result.removed += deleted.count;
          continue;
        }

        const file = change.file;
        if (!file || !SUPPORTED_MIMES.has(file.mimeType ?? "")) continue;

        const existing = await prisma.recordFile.findFirst({
          where: { storagePath: fileId },
          select: { id: true, name: true, size: true },
        });

        if (existing) {
          const nameChanged = existing.name !== file.name;
          const sizeChanged = existing.size !== parseInt(file.size ?? "0");
          if (nameChanged || sizeChanged) {
            await prisma.recordFile.updateMany({
              where: { storagePath: fileId },
              data: { name: file.name!, size: parseInt(file.size ?? "0") },
            });
            result.updated++;
          } else {
            result.unchanged++;
          }
        } else {
          // New file — look up parent folder name to determine category
          const parentId = file.parents?.[0];
          const folderName = parentId ? await getFolderName(drive, parentId) : "";

          await prisma.recordFile.create({
            data: {
              recordId: null,
              name: file.name!,
              url: driveUrl(fileId, file.mimeType!),
              storagePath: fileId,
              folderPath: folderName,
              type: file.mimeType!,
              size: parseInt(file.size ?? "0"),
              category: categoryFromPath(folderName),
              aiMatch: false,
              aiConfidence: null,
            },
          });
          result.added++;
        }
      }

      // Advance token
      if (res.data.newStartPageToken) {
        currentToken = res.data.newStartPageToken;
        break;
      }
      if (res.data.nextPageToken) {
        currentToken = res.data.nextPageToken;
      } else {
        break;
      }
    }
  } catch (err) {
    result.errors.push((err as Error).message);
  }

  // Persist the new token
  await prisma.config.upsert({
    where: { key: "drive_page_token" },
    update: { value: currentToken },
    create: { key: "drive_page_token", value: currentToken },
  });

  return result;
}

// ─── Webhook registration ─────────────────────────────────────────────────────

async function refreshPageToken(): Promise<void> {
  const drive = getDriveClient();
  const res = await drive.changes.getStartPageToken();
  const token = res.data.startPageToken!;
  await prisma.config.upsert({
    where: { key: "drive_page_token" },
    update: { value: token },
    create: { key: "drive_page_token", value: token },
  });
}

export async function registerDriveWebhook(): Promise<void> {
  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    console.warn("[drive-webhook] APP_URL not set — skipping webhook registration");
    return;
  }

  const drive = getDriveClient();

  // Get a fresh start page token
  const startRes = await drive.changes.getStartPageToken();
  const pageToken = startRes.data.startPageToken!;

  const channelId = crypto.randomUUID();
  const expiryMs = Date.now() + 7 * 24 * 60 * 60 * 1000; // max 7 days

  const res = await drive.changes.watch({
    pageToken,
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: `${appUrl}/api/sync/webhook`,
      token: process.env.DRIVE_WEBHOOK_SECRET,
      expiration: String(expiryMs),
    },
  });

  await Promise.all([
    prisma.config.upsert({
      where: { key: "drive_page_token" },
      update: { value: pageToken },
      create: { key: "drive_page_token", value: pageToken },
    }),
    prisma.config.upsert({
      where: { key: "drive_channel_id" },
      update: { value: channelId },
      create: { key: "drive_channel_id", value: channelId },
    }),
    prisma.config.upsert({
      where: { key: "drive_resource_id" },
      update: { value: res.data.resourceId! },
      create: { key: "drive_resource_id", value: res.data.resourceId! },
    }),
    prisma.config.upsert({
      where: { key: "drive_channel_expiry" },
      update: { value: String(expiryMs) },
      create: { key: "drive_channel_expiry", value: String(expiryMs) },
    }),
  ]);

  console.log(`[drive-webhook] Channel ${channelId} registered, expires ${new Date(expiryMs).toISOString()}`);
}

export async function renewDriveWebhookIfNeeded(): Promise<void> {
  const expiryRecord = await prisma.config.findUnique({ where: { key: "drive_channel_expiry" } });

  if (!expiryRecord) {
    await registerDriveWebhook();
    return;
  }

  const msUntilExpiry = parseInt(expiryRecord.value) - Date.now();
  const twoDays = 2 * 24 * 60 * 60 * 1000;

  if (msUntilExpiry < twoDays) {
    // Stop the old channel if possible
    const [channelRecord, resourceRecord] = await Promise.all([
      prisma.config.findUnique({ where: { key: "drive_channel_id" } }),
      prisma.config.findUnique({ where: { key: "drive_resource_id" } }),
    ]);
    if (channelRecord?.value && resourceRecord?.value) {
      try {
        const drive = getDriveClient();
        await drive.channels.stop({
          requestBody: { id: channelRecord.value, resourceId: resourceRecord.value },
        });
      } catch {
        // Channel may already be expired — ignore
      }
    }
    await registerDriveWebhook();
  }
}
