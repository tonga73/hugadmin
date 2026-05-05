import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await prisma.recordActivity.findMany({
    where: { recordId: Number(id) },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });
  return NextResponse.json(activity);
}
