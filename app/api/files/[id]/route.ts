// app/api/files/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

// PATCH /api/files/[id] — reassign file to another record (or unassign)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fileId = parseInt(id);

  if (isNaN(fileId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = (await req.json()) as { recordId?: number | null };

  const updated = await prisma.recordFile.update({
    where: { id: fileId },
    data: { recordId: body.recordId ?? null },
  });

  return NextResponse.json(updated);
}

// DELETE /api/files/[id] — delete file from storage and DB
export async function DELETE(
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

  await deleteFile(file.storagePath);
  await prisma.recordFile.delete({ where: { id: fileId } });

  return NextResponse.json({ ok: true });
}
