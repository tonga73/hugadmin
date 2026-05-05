import { EventEmitter } from "events";

// Singleton SSE broadcaster — works on Railway single-instance
const g = globalThis as unknown as { _chatEvents?: EventEmitter };
if (!g._chatEvents) g._chatEvents = new EventEmitter().setMaxListeners(200);
export const chatEvents = g._chatEvents;

export function emitNewMessage(chatId: number, payload: unknown) {
  chatEvents.emit(`chat:${chatId}`, payload);
}
