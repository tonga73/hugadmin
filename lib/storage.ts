// lib/storage.ts — Google Drive storage helpers (server-side)
import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

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

// In-memory cache: subfolder name → Drive folder ID (lives for the duration of the process)
const folderCache = new Map<string, string>();

/**
 * Find an existing subfolder by name inside parentId, or create it if it doesn't exist.
 * Results are cached in memory to avoid extra API calls on subsequent uploads.
 */
async function findOrCreateFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string> {
  const cacheKey = `${parentId}/${name}`;
  if (folderCache.has(cacheKey)) return folderCache.get(cacheKey)!;

  // Search for an existing folder with this name inside the parent
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
  });

  let folderId = res.data.files?.[0]?.id ?? null;

  if (!folderId) {
    const created = await drive.files.create({
      requestBody: {
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      },
      fields: "id",
    });
    folderId = created.data.id!;
  }

  folderCache.set(cacheKey, folderId);
  return folderId;
}

// Subfolder names per category
const CATEGORY_FOLDERS: Record<string, string> = {
  APARTADO: "Apartados",
  EXPEDIENTE: "Expediente Unificado",
};

/**
 * Upload a file buffer to Google Drive.
 * - For APARTADO / EXPEDIENTE categories: goes into a named subfolder, filename includes record info.
 * - For DRIVE / other: goes into the root folder with the provided filename.
 * Returns { url, storagePath } where storagePath = Drive file ID.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  options?: { category?: string; record?: { order: string; name: string } }
): Promise<{ url: string; storagePath: string }> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  let parentId = rootFolderId;
  let finalName = filename;

  const subfolderName = options?.category ? CATEGORY_FOLDERS[options.category] : null;

  if (subfolderName && rootFolderId) {
    // Resolve (or create) the subfolder
    parentId = await findOrCreateFolder(drive, subfolderName, rootFolderId);

    // Prefix filename with record info: "12345_2020 - Nombre del Expediente - archivo.pdf"
    if (options?.record) {
      const { order, name } = options.record;
      const safeName = name.slice(0, 40).replace(/[/\\?%*:|"<>]/g, "-");
      finalName = `${order} - ${safeName} - ${filename}`;
    }
  }

  const response = await drive.files.create({
    requestBody: {
      name: finalName,
      ...(parentId ? { parents: [parentId] } : {}),
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id",
  });

  const fileId = response.data.id!;

  // Make file publicly readable
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  const url = `https://drive.google.com/uc?id=${fileId}&export=download`;

  return { url, storagePath: fileId };
}

/**
 * Create a native Google Doc in Drive (no file upload).
 * Places it in the APARTADO subfolder and prefixes the name with record info.
 * Returns { url, storagePath } where storagePath = Drive file ID.
 */
export async function createDriveDoc(
  docName: string,
  options?: { record?: { order: string; name: string } }
): Promise<{ url: string; storagePath: string }> {
  const drive = getDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const parentId = rootFolderId
    ? await findOrCreateFolder(drive, CATEGORY_FOLDERS.APARTADO, rootFolderId)
    : undefined;

  let finalName = docName;
  if (options?.record) {
    const { order, name } = options.record;
    const safeName = name.slice(0, 40).replace(/[/\\?%*:|"<>]/g, "-");
    finalName = `${order} - ${safeName} - ${docName}`;
  }

  const response = await drive.files.create({
    requestBody: {
      name: finalName,
      mimeType: "application/vnd.google-apps.document",
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: "id",
  });

  const fileId = response.data.id!;

  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "writer", type: "anyone" },
    });
  } catch (err) {
    // Domain policy may restrict public sharing — the doc is still created and accessible
    // to the service account; log and continue.
    console.warn("[createDriveDoc] Could not set public permission:", err instanceof Error ? err.message : err);
  }

  return {
    url: `https://docs.google.com/document/d/${fileId}/edit`,
    storagePath: fileId,
  };
}

/**
 * Download a file from Google Drive by its file ID.
 */
export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = getDriveClient();

  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );

  return Buffer.from(response.data as ArrayBuffer);
}

/**
 * Delete a file from Google Drive by its file ID.
 */
export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId });
}
