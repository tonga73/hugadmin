"use client";

import { useState, useEffect } from "react";
import { ChatList } from "@/components/chat/chat-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { MessageSquare } from "lucide-react";
import type { Chat, ChatUser } from "@/components/chat/chat-types";
import { cn } from "@/lib/utils";

interface ChatAppProps {
  meId: number;
  allUsers: ChatUser[];
}

export function ChatApp({ meId, allUsers }: ChatAppProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/chats")
      .then((r) => r.json())
      .then((data) => {
        setChats(Array.isArray(data) ? data : []);
        if (data.length > 0 && !activeChatId) setActiveChatId(data[0].id);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const showList = !activeChatId || !activeChat;

  return (
    <div className="flex-1 flex overflow-hidden rounded-xl border">
      {/* Chat list — full on mobile when no chat selected, sidebar on md+ */}
      <div className={cn(
        "shrink-0 w-full md:w-64 md:block border-r",
        activeChatId ? "hidden md:block" : "block"
      )}>
        <ChatList
          chats={chats}
          activeChatId={activeChatId}
          meId={meId}
          users={allUsers}
          onSelect={setActiveChatId}
          onChatCreated={(chat) => setChats((prev) => {
            const exists = prev.find((c) => c.id === chat.id);
            return exists ? prev : [chat, ...prev];
          })}
        />
      </div>

      {/* Chat window — full on mobile when chat selected, fills remaining on md+ */}
      <div className={cn(
        "flex-1 min-w-0 flex flex-col",
        !activeChatId ? "hidden md:flex" : "flex"
      )}>
        {activeChat ? (
          <>
            {/* Mobile back button */}
            <button
              onClick={() => setActiveChatId(null)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border-b shrink-0"
            >
              ← Conversaciones
            </button>
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatWindow chat={activeChat} meId={meId} allUsers={allUsers} />
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">Seleccioná una conversación</p>
          </div>
        )}
      </div>
    </div>
  );
}
