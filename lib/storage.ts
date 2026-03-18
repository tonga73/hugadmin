// lib/storage.ts — Google Drive storage helpers (server-side)
import { google } from "googleapis";
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

/**
 * Upload a file buffer to Google Drive.
 * Returns { url, storagePath } where storagePath = Drive file ID.
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ url: string; storagePath: string }> {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      ...(folderId ? { parents: [folderId] } : {}),
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: "id",
  });

  const fileId = response.data.id!;

  // Make file publicly readable so the URL works without auth
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });

  const url = `https://drive.google.com/uc?id=${fileId}&export=download`;

  return { url, storagePath: fileId };
}

/**
 * Download a file from Google Drive by its file ID.
 * Returns a Buffer with the file contents.
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
