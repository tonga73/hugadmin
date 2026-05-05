"use client";

import { useState, useEffect } from "react";
import { X, MessageSquare } from "lucide-react";
import { ChatList } from "./chat-list";
import { ChatWindow } from "./chat-window";
import { cn } from "@/lib/utils";
import type { Chat, ChatUser } from "./chat-types";

interface ChatPanelProps {
  meId: number;
  allUsers: ChatUser[];
}

export function ChatPanel({ meId, allUsers }: ChatPanelProps) {
  const [open, setOpen] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/chats")
      .then((r) => r.json())
      .then((data) => {
        setChats(Array.isArray(data) ? data : []);
        if (data.length > 0) setActiveChatId(data[0].id);
      })
      .catch(() => {});
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors z-50"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-0 right-2 sm:right-4 w-[calc(100vw-1rem)] sm:w-[680px] h-[75dvh] sm:h-[520px] rounded-t-xl border shadow-2xl bg-background flex overflow-hidden z-50",
    )}>
      {/* Chat list */}
      <div className="w-44 sm:w-56 shrink-0">
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          meId={meId}
          users={allUsers}
          onSelect={setActiveChatId}
          onChatCreated={(chat) => setChats((prev) => prev.find((c) => c.id === chat.id) ? prev : [chat, ...prev])}
        />
      </div>

      {/* Chat window */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-end px-2 py-1.5 border-b shrink-0">
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeChat ? (
            <ChatWindow chat={activeChat} meId={meId} allUsers={allUsers} />
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Seleccioná una conversación
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
