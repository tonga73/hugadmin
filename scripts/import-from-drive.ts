#!/usr/bin/env tsx
// scripts/import-from-drive.ts — Import files already on Google Drive into the DB
// Usage: pnpm tsx scripts/import-from-drive.ts --folder-id DRIVE_FOLDER_ID
//
// Prerequisites:
//   - Files already uploaded to Google Drive
//   - Google Drive API enabled in Google Cloud Console
//   - Service account (FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY)
//     has Editor access to the Drive folder
//   - ANTHROPIC_API_KEY set

import * as dotenv from "dotenv";
dotenv.config();

import { google, drive_v3 } from "googleapis";
import { PrismaClient } from "../app/generated/prisma/client";
import { extractText, matchFileToRecord } from "../lib/ai-matcher";

const prisma = new PrismaClient();

// ─── Drive client ─────────────────────────────────────────────────────────────

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

// ─── List all files in a Drive folder (recursive) ─────────────────────────────

async function listAllFiles(
  drive: drive_v3.Drive,
  folderId: string
): Promise<drive_v3.Schema$File[]> {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, size, parents)",
      pageSize: 100,
      ...(pageToken ? { pageToken } : {}),
    });

    const items = res.data.files ?? [];

    for (const item of items) {
      if (item.mimeType === "application/vnd.google-apps.folder") {
        // Recurse into subfolders
        const subFiles = await listAllFiles(drive, item.id!);
        files.push(...subFiles);
      } else {
        files.push(item);
      }
    }

    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

// ─── Download a file from Drive ───────────────────────────────────────────────

async function downloadDriveFile(
  drive: drive_v3.Drive,
  fileId: string
): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

// ─── Make a file publicly readable and return its download URL ────────────────

async function makePublicAndGetUrl(
  drive: drive_v3.Drive,
  fileId: string
): Promise<string> {
  await drive.permissions.create({
    fileId,
    requestBody: { role: "reader", type: "anyone" },
  });
  return `https://drive.google.com/uc?id=${fileId}&export=download`;
}

// ─── MIME types we can process ────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const folderIdx = args.indexOf("--folder-id");
  const folderId = folderIdx !== -1 ? args[folderIdx + 1] : null;

  if (!folderId) {
    console.error("❌  Uso: pnpm tsx scripts/import-from-drive.ts --folder-id <DRIVE_FOLDER_ID>");
    process.exit(1);
  }

  const drive = getDriveClient();

  console.log(`🔍  Listando archivos en la carpeta de Drive...`);
  const allFiles = await listAllFiles(drive, folderId);
  const files = allFiles.filter((f) => SUPPORTED_MIMES.has(f.mimeType ?? ""));

  console.log(`📄  Archivos encontrados: ${files.length} (de ${allFiles.length} total)\n`);

  if (files.length === 0) {
    console.log("⚠️  No hay archivos para procesar.");
    return;
  }

  // Load all records once
  const records = await prisma.record.findMany({
    select: { id: true, order: true, name: true, code: true },
  });
  console.log(`🗄️  Expedientes en DB: ${records.length}\n`);

  // Skip files already imported (by storagePath = Drive file ID)
  const existing = await prisma.recordFile.findMany({ select: { storagePath: true } });
  const existingIds = new Set(existing.map((f) => f.storagePath));

  let assigned = 0;
  let unassigned = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const fileId = file.id!;
    const filename = file.name ?? fileId;
    const mimeType = file.mimeType ?? "application/octet-stream";

    if (existingIds.has(fileId)) {
      process.stdout.write(`⏭️  ${filename} — ya importado\n`);
      skipped++;
      continue;
    }

    process.stdout.write(`⏳  ${filename} ... `);

    try {
      // Download
      const buffer = await downloadDriveFile(drive, fileId);

      // Extract text (skip for video)
      let text = "";
      if (!mimeType.startsWith("video/")) {
        text = await extractText(buffer, mimeType, filename);
      }

      // AI match
      const match = await matchFileToRecord(
        text,
        records as { id: number; order: string; name: string; code: string | null }[]
      );
      const shouldAssign = match.recordId !== null && match.confidence > 0.7;
      const recordId = shouldAssign ? match.recordId : null;

      // Make public + get URL
      const url = await makePublicAndGetUrl(drive, fileId);

      // Create DB record
      await prisma.recordFile.create({
        data: {
          recordId,
          name: filename,
          url,
          storagePath: fileId, // Drive file ID
          type: mimeType,
          size: parseInt(file.size ?? "0"),
          aiMatch: shouldAssign,
          aiConfidence: match.confidence,
        },
      });

      if (shouldAssign) {
        const rec = records.find((r) => r.id === recordId);
        console.log(`✅  asignado a "${rec?.order}" (confianza: ${(match.confidence * 100).toFixed(0)}%)`);
        assigned++;
      } else {
        console.log(`⚠️  sin asignar (confianza: ${(match.confidence * 100).toFixed(0)}%)`);
        unassigned++;
      }
    } catch (err) {
      console.log(`❌  error: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Asignados:     ${assigned}
⚠️   Sin asignar:  ${unassigned}
⏭️   Ya importados: ${skipped}
❌  Errores:       ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
