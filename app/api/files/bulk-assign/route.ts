// app/api/files/bulk-assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/files/bulk-assign — assign multiple files to a record at once
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { fileIds: number[]; recordId: number };

  if (!Array.isArray(body.fileIds) || body.fileIds.length === 0) {
    return NextResponse.json({ error: "fileIds requerido" }, { status: 400 });
  }
  if (!body.recordId) {
    return NextResponse.json({ error: "recordId requerido" }, { status: 400 });
  }

  const result = await prisma.recordFile.updateMany({
    where: { id: { in: body.fileIds } },
    data: { recordId: body.recordId },
  });

  return NextResponse.json({ updated: result.count });
}
