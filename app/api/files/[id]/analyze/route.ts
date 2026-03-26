// app/api/files/[id]/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { downloadFile } from "@/lib/storage";
import { extractText, matchFileToRecord } from "@/lib/ai-matcher";

// POST /api/files/[id]/analyze — re-run AI analysis on a file
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fileId = parseInt(id);

  if (isNaN(fileId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const file = await prisma.recordFile.findUnique({ where: { id: fileId } });

  if (!file) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  // Download file from Google Drive using stored file ID
  const buffer = await downloadFile(file.storagePath);

  // Extract text
  const text = await extractText(Buffer.from(buffer), file.type, file.name);

  // Get all record candidates
  const candidates = await prisma.record.findMany({
    select: { id: true, order: true, name: true, code: true },
  });

  const match = await matchFileToRecord(text, candidates);

  const newRecordId =
    match.recordId !== null && match.confidence > 0.7 ? match.recordId : file.recordId;

  const updated = await prisma.recordFile.update({
    where: { id: fileId },
    data: {
      recordId: newRecordId,
      aiMatch: match.recordId !== null && match.confidence > 0.7,
      aiConfidence: match.confidence,
    },
  });

  return NextResponse.json({ file: updated, match });
}
