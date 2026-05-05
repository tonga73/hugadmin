import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const session = await getSessionUser();
  if (!session?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.email }, select: { id: true } });
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { userId: me.id, read: false } }),
  ]);

  return NextResponse.json({ notifications, unread });
}

export async function DELETE() {
  const session = await getSessionUser();
  if (!session?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.email }, select: { id: true } });
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.notification.deleteMany({ where: { userId: me.id, read: true } });
  return NextResponse.json({ ok: true });
}
