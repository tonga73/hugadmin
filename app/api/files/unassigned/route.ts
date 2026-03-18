// app/api/files/unassigned/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/files/unassigned — list files without a record assignment
export async function GET() {
  const files = await prisma.recordFile.findMany({
    where: { recordId: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(files);
}
