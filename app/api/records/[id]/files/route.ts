// app/api/records/[id]/files/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";
import { extractText, matchFileToRecord } from "@/lib/ai-matcher";
import { FileCategory } from "@/app/generated/prisma/enums";

// GET /api/records/[id]/files — list files for a record
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recordId = parseInt(id);

  if (isNaN(recordId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const files = await prisma.recordFile.findMany({
    where: { recordId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(files);
}

// POST /api/records/[id]/files — upload a file to a record
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recordId = parseInt(id);

  if (isNaN(recordId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const analyze = formData.get("analyze") === "true";
  const categoryRaw = (formData.get("category") as string) || "DRIVE";
  const category = Object.values(FileCategory).includes(categoryRaw as FileCategory)
    ? (categoryRaw as FileCategory)
    : FileCategory.DRIVE;

  if (!file) {
    return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  }

  const record = await prisma.record.findUnique({
    where: { id: recordId },
    select: { order: true, name: true },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name}`;

  const { url, storagePath } = await uploadFile(buffer, filename, file.type, {
    category,
    record: record ?? undefined,
  });

  let aiMatch = false;
  let aiConfidence: number | null = null;

  if (analyze) {
    const text = await extractText(buffer, file.type, file.name);
    const candidates = await prisma.record.findMany({
      select: { id: true, order: true, name: true, code: true },
    });
    const match = await matchFileToRecord(text, candidates);
    aiMatch = match.recordId !== null && match.confidence > 0.7;
    aiConfidence = match.confidence;
  }

  const recordFile = await prisma.recordFile.create({
    data: {
      recordId,
      name: file.name,
      url,
      storagePath,
      type: file.type,
      size: file.size,
      aiMatch,
      aiConfidence,
      category,
    },
  });

  return NextResponse.json(recordFile, { status: 201 });
}
