// app/api/records/[id]/files/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { createDriveDoc } from "@/lib/storage";

const bodySchema = z.object({
  name: z.string().min(1),
});

// POST /api/records/[id]/files/create — create a Google Doc in Drive and register it
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recordId = parseInt(id);

  if (isNaN(recordId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const record = await prisma.record.findUnique({
    where: { id: recordId },
    select: { order: true, name: true },
  });

  let url: string;
  let storagePath: string;

  try {
    ({ url, storagePath } = await createDriveDoc(parsed.data.name, {
      record: record ?? undefined,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[files/create] Drive error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const recordFile = await prisma.recordFile.create({
    data: {
      recordId,
      name: parsed.data.name,
      url,
      storagePath,
      type: "application/vnd.google-apps.document",
      size: 0,
      aiMatch: false,
      aiConfidence: null,
      category: "APARTADO",
    },
  });

  return NextResponse.json(recordFile, { status: 201 });
}
