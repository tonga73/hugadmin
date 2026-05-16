import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor") ? Number(searchParams.get("cursor")) : undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "25"), 50);
  const userIdParam = searchParams.get("userId") ? Number(searchParams.get("userId")) : undefined;
  const recordIdParam = searchParams.get("recordId") ? Number(searchParams.get("recordId")) : undefined;

  // Non-admins can only see their own activity
  const resolvedUserId = user.role === "ADMIN" ? userIdParam : user.id;

  const items = await prisma.recordActivity.findMany({
    where: {
      ...(resolvedUserId !== undefined ? { userId: resolvedUserId } : {}),
      ...(recordIdParam ? { recordId: recordIdParam } : {}),
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { id: "desc" },
    take: limit + 1,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      record: { select: { id: true, name: true, order: true } },
    },
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
