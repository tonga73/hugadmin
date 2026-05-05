import { EventEmitter } from "events";

const g = globalThis as unknown as { _notifEvents?: EventEmitter };
if (!g._notifEvents) g._notifEvents = new EventEmitter().setMaxListeners(200);
export const notifEvents = g._notifEvents;

export function emitNotification(userId: number, payload: unknown) {
  notifEvents.emit(`notif:${userId}`, payload);
}
