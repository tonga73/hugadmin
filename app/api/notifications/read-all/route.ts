import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST() {
  const session = await getSessionUser();
  if (!session?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.email }, select: { id: true } });
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: me.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
