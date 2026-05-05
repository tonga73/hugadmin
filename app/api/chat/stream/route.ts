import { NextRequest } from "next/server";
import { chatEvents } from "@/lib/chat-events";
import { notifEvents } from "@/lib/notification-events";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session?.email) return new Response("No autorizado", { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.email }, select: { id: true } });
  if (!me) return new Response("No autorizado", { status: 401 });

  // Get all chat IDs this user belongs to
  const memberships = await prisma.chatMember.findMany({
    where: { userId: me.id },
    select: { chatId: true },
  });
  const chatIds = memberships.map((m) => m.chatId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Keep-alive every 20s
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 20000);

      const handlers: Array<{ chatId: number; handler: (msg: unknown) => void }> = [];

      for (const chatId of chatIds) {
        const handler = (msg: unknown) => send("message", { chatId, message: msg });
        chatEvents.on(`chat:${chatId}`, handler);
        handlers.push({ chatId, handler });
      }

      const notifHandler = (notif: unknown) => send("notification", notif);
      notifEvents.on(`notif:${me.id}`, notifHandler);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        for (const { chatId, handler } of handlers) {
          chatEvents.off(`chat:${chatId}`, handler);
        }
        notifEvents.off(`notif:${me.id}`, notifHandler);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
