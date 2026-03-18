#!/usr/bin/env tsx
// scripts/test-drive-connection.ts — Test Drive connection without AI
// Usage: pnpm tsx scripts/test-drive-connection.ts --folder-id DRIVE_FOLDER_ID

import * as dotenv from "dotenv";
dotenv.config();

import { google, drive_v3 } from "googleapis";
import { PrismaClient } from "../app/generated/prisma/client";

const prisma = new PrismaClient();

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

async function listFiles(
  drive: drive_v3.Drive,
  folderId: string
): Promise<drive_v3.Schema$File[]> {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id, name, mimeType, size)",
    pageSize: 10, // solo los primeros 10 para la prueba
  });
  return res.data.files ?? [];
}

async function main() {
  const args = process.argv.slice(2);
  const folderIdx = args.indexOf("--folder-id");
  const folderId = folderIdx !== -1 ? args[folderIdx + 1] : null;

  if (!folderId) {
    console.error("❌  Uso: pnpm tsx scripts/test-drive-connection.ts --folder-id <ID>");
    process.exit(1);
  }

  // 1. Probar conexión a Drive
  console.log("1️⃣  Conectando a Google Drive...");
  const drive = getDriveClient();

  let files: drive_v3.Schema$File[];
  try {
    files = await listFiles(drive, folderId);
    console.log(`✅  Conexión OK — ${files.length} archivos encontrados (mostrando primeros 10)\n`);
  } catch (err) {
    console.error("❌  Error conectando a Drive:", (err as Error).message);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("⚠️  La carpeta está vacía o el service account no tiene acceso.");
    return;
  }

  // 2. Mostrar archivos encontrados
  console.log("📄  Archivos:");
  for (const f of files) {
    const size = f.size ? `${(parseInt(f.size) / 1024).toFixed(1)} KB` : "—";
    console.log(`   • ${f.name} (${f.mimeType}) — ${size}`);
  }

  // 3. Probar conexión a DB
  console.log("\n2️⃣  Conectando a la base de datos...");
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅  DB OK\n");
  } catch (err) {
    console.error("❌  Error conectando a DB:", (err as Error).message);
    process.exit(1);
  }

  // 4. Subir el primer archivo como prueba (sin IA, sin asignar)
  const testFile = files[0];
  console.log(`3️⃣  Probando subida del primer archivo: "${testFile.name}"...`);

  try {
    // Hacer el archivo público
    await drive.permissions.create({
      fileId: testFile.id!,
      requestBody: { role: "reader", type: "anyone" },
    });

    const url = `https://drive.google.com/uc?id=${testFile.id}&export=download`;

    // Verificar si ya existe
    const existing = await prisma.recordFile.findFirst({
      where: { storagePath: testFile.id! },
    });

    if (existing) {
      console.log("⏭️  Ya existe en la DB, salteando.");
    } else {
      await prisma.recordFile.create({
        data: {
          recordId: null,
          name: testFile.name ?? testFile.id!,
          url,
          storagePath: testFile.id!,
          type: testFile.mimeType ?? "application/octet-stream",
          size: parseInt(testFile.size ?? "0"),
          aiMatch: false,
          aiConfidence: null,
        },
      });
      console.log("✅  Registro creado en DB");
      console.log(`   URL: ${url}`);
    }
  } catch (err) {
    console.error("❌  Error:", (err as Error).message);
    process.exit(1);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Todo OK. Verificá:
  1. Que el archivo aparezca en /unassigned en la app
  2. Que la URL de Drive funcione en el navegador
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
