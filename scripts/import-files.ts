#!/usr/bin/env tsx
// scripts/import-files.ts — Bulk import local files into Firebase Storage with AI matching
// Usage: pnpm tsx scripts/import-files.ts --folder ./mis-archivos

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

import { PrismaClient } from "../app/generated/prisma/client";
import { uploadFile } from "../lib/storage";
import { extractText, matchFileToRecord } from "../lib/ai-matcher";

const prisma = new PrismaClient();

const SUPPORTED_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

function walkDir(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_TYPES[ext]) files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const folderIdx = args.indexOf("--folder");
  const folder = folderIdx !== -1 ? args[folderIdx + 1] : null;

  if (!folder) {
    console.error("❌  Uso: pnpm tsx scripts/import-files.ts --folder <ruta>");
    process.exit(1);
  }

  const absFolder = path.resolve(folder);
  if (!fs.existsSync(absFolder)) {
    console.error(`❌  La carpeta no existe: ${absFolder}`);
    process.exit(1);
  }

  console.log(`📂  Escaneando: ${absFolder}`);
  const filePaths = walkDir(absFolder);
  console.log(`📄  Archivos encontrados: ${filePaths.length}\n`);

  if (filePaths.length === 0) {
    console.log("⚠️  No hay archivos para importar.");
    return;
  }

  // Load all records once
  const records = await prisma.record.findMany({
    select: { id: true, order: true, name: true, code: true },
  });
  console.log(`🗄️  Expedientes en DB: ${records.length}\n`);

  let assigned = 0;
  let unassigned = 0;
  let errors = 0;

  for (const filePath of filePaths) {
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeType = SUPPORTED_TYPES[ext] || "application/octet-stream";
    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    process.stdout.write(`⏳  ${filename} ... `);

    try {
      // Extract text
      let text = "";
      if (!mimeType.startsWith("video/")) {
        text = await extractText(buffer, mimeType, filename);
      }

      // AI match
      const match = await matchFileToRecord(text, records as { id: number; order: string; name: string; code: string | null }[]);
      const shouldAssign = match.recordId !== null && match.confidence > 0.7;
      const recordId = shouldAssign ? match.recordId : null;

      const { url, storagePath } = await uploadFile(buffer, `${Date.now()}-${filename}`, mimeType);

      await prisma.recordFile.create({
        data: {
          recordId,
          name: filename,
          url,
          storagePath,
          type: mimeType,
          size: stats.size,
          aiMatch: shouldAssign,
          aiConfidence: match.confidence,
        },
      });

      if (shouldAssign) {
        const rec = records.find((r) => r.id === recordId);
        console.log(
          `✅  asignado a "${rec?.order}" (confianza: ${(match.confidence * 100).toFixed(0)}%)`
        );
        assigned++;
      } else {
        console.log(
          `⚠️  sin asignar (confianza: ${(match.confidence * 100).toFixed(0)}%)`
        );
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
❌  Errores:       ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
