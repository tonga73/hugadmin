import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

async function getDbUser() {
  const session = await getSessionUser();
  if (!session?.email) return null;
  return prisma.user.findUnique({ where: { email: session.email }, select: { id: true } });
}

// List all chats for current user
export async function GET() {
  const me = await getDbUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const chats = await prisma.chat.findMany({
    where: { members: { some: { userId: me.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const withUnread = chats.map((chat) => {
    const membership = chat.members.find((m) => m.userId === me.id);
    const lastReadId = membership?.lastReadId ?? 0;
    const lastMsg = chat.messages[0] ?? null;
    return { ...chat, lastReadId, lastMsg };
  });

  return NextResponse.json(withUnread);
}

// Create DM or group chat
export async function POST(req: NextRequest) {
  const me = await getDbUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { userIds, name, isGroup } = await req.json();
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos un usuario" }, { status: 400 });
  }

  const allMemberIds: number[] = Array.from(new Set([me.id, ...userIds]));

  // For DMs, check if one already exists
  if (!isGroup && allMemberIds.length === 2) {
    const existing = await prisma.chat.findFirst({
      where: {
        isGroup: false,
        members: { every: { userId: { in: allMemberIds } } },
      },
      include: { members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } }, messages: { take: 1 } },
    });
    if (existing) return NextResponse.json(existing);
  }

  const chat = await prisma.chat.create({
    data: {
      name: isGroup ? name : null,
      isGroup: isGroup ?? false,
      members: { create: allMemberIds.map((userId) => ({ userId })) },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
      messages: { take: 1 },
    },
  });

  return NextResponse.json(chat);
}
