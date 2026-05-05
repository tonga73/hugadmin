import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { emitNewMessage } from "@/lib/chat-events";
import { createNotifications } from "@/lib/notifications";

async function getDbUser() {
  const session = await getSessionUser();
  if (!session?.email) return null;
  return prisma.user.findUnique({ where: { email: session.email }, select: { id: true } });
}

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true, email: true, image: true } },
  replyTo: {
    select: {
      id: true, text: true,
      sender: { select: { id: true, name: true } },
    },
  },
  record: { select: { id: true, name: true, order: true, tracing: true } },
  file: { select: { id: true, name: true, type: true, url: true } },
} as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getDbUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const chatId = Number(id);

  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId: me.id } } });
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const cursor = req.nextUrl.searchParams.get("cursor");
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: 40,
    ...(cursor && { cursor: { id: Number(cursor) }, skip: 1 }),
    include: MESSAGE_INCLUDE,
  });

  return NextResponse.json(messages.reverse());
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getDbUser();
  if (!me) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const chatId = Number(id);

  const member = await prisma.chatMember.findUnique({ where: { chatId_userId: { chatId, userId: me.id } } });
  if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { text, replyToId, recordId, fileId } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        chatId,
        senderId: me.id,
        text: text.trim(),
        ...(replyToId && { replyToId }),
        ...(recordId && { recordId }),
        ...(fileId && { fileId }),
      },
      include: MESSAGE_INCLUDE,
    }),
    prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }),
  ]);

  emitNewMessage(chatId, message);

  // Notify other chat members
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    select: { name: true, isGroup: true, members: { select: { userId: true } } },
  });
  if (chat) {
    const recipientIds = chat.members
      .map((m) => m.userId)
      .filter((uid) => uid !== me.id);
    const senderName = message.sender.name ?? message.sender.email;
    const title = chat.isGroup
      ? `${senderName} en ${chat.name ?? "grupo"}`
      : `Nuevo mensaje de ${senderName}`;
    const preview = message.text.length > 60 ? message.text.slice(0, 60) + "…" : message.text;
    await createNotifications(recipientIds, {
      type: "CHAT_MESSAGE",
      title,
      body: preview,
      entityId: chatId,
    });
  }

  return NextResponse.json(message);
}
