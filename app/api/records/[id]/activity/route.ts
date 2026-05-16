import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor") ? Number(searchParams.get("cursor")) : undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "25"), 50);

  const items = await prisma.recordActivity.findMany({
    where: {
      recordId: Number(id),
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { id: "desc" },
    take: limit + 1,
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({
    items: data.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    nextCursor,
    hasMore,
  });
}
