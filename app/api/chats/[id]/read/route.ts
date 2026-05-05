import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.email }, select: { id: true } });
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const chatId = Number(id);
  const { lastMessageId } = await req.json();

  await prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId: me.id } },
    data: { lastReadId: lastMessageId },
  });

  return NextResponse.json({ ok: true });
}
