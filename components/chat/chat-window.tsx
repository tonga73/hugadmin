"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Users, User } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import type { Chat, Message, ChatUser } from "./chat-types";

interface ChatWindowProps {
  chat: Chat;
  meId: number;
  allUsers: ChatUser[];
}

function chatDisplayName(chat: Chat, meId: number): string {
  if (chat.isGroup) return chat.name ?? "Grupo sin nombre";
  const other = chat.members.find((m) => m.userId !== meId);
  return other?.user.name ?? other?.user.email ?? "Usuario";
}

export function ChatWindow({ chat, meId, allUsers }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const members = chat.members.map((m) => m.user);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // Load messages
  useEffect(() => {
    setLoading(true);
    fetch(`/api/chats/${chat.id}/messages`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [chat.id]);

  // Scroll on load + new messages
  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [loading, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  // Mark as read when chat is open
  useEffect(() => {
    if (messages.length === 0) return;
    const lastId = messages[messages.length - 1].id;
    fetch(`/api/chats/${chat.id}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastMessageId: lastId }),
    });
  }, [chat.id, messages]);

  // SSE: listen for new messages
  useEffect(() => {
    const es = new EventSource("/api/chat/stream");
    es.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);
      if (data.chatId === chat.id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    });
    return () => es.close();
  }, [chat.id]);

  const handleSend = async (text: string, replyToId?: number, recordId?: number) => {
    const res = await fetch(`/api/chats/${chat.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, replyToId, recordId }),
    });
    if (!res.ok) throw new Error();
    const msg = await res.json();
    setMessages((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b shrink-0">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          {chat.isGroup ? <Users className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div>
          <p className="text-sm font-semibold">{chatDisplayName(chat, meId)}</p>
          {chat.isGroup && (
            <p className="text-[11px] text-muted-foreground">{chat.members.length} participantes</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Cargando mensajes...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Todavía no hay mensajes. ¡Escribí el primero!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMe={msg.sender.id === meId}
              onReply={setReplyTo}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSend={handleSend}
        members={members}
        meId={meId}
      />
    </div>
  );
}
