import prisma from "./prisma";
import { emitNotification } from "./notification-events";

type NotifData = {
  type: "RECORD_ASSIGNED" | "RECORD_UPDATED" | "CHAT_MESSAGE";
  title: string;
  body: string;
  entityId?: number;
};

export async function createNotification(userId: number, data: NotifData) {
  const notif = await prisma.notification.create({ data: { userId, ...data } });
  emitNotification(userId, notif);
  return notif;
}

export async function createNotifications(userIds: number[], data: NotifData) {
  if (userIds.length === 0) return;
  await Promise.all(userIds.map((userId) => createNotification(userId, data)));
}
