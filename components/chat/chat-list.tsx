"use client";

import { useState } from "react";
import { User, Users, Plus, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chat, ChatUser } from "./chat-types";
import { NewChatDialog } from "./new-chat-dialog";

function chatDisplayName(chat: Chat, meId: number): string {
  if (chat.isGroup) return chat.name ?? "Grupo sin nombre";
  const other = chat.members.find((m) => m.userId !== meId);
  return other?.user.name ?? other?.user.email ?? "Usuario";
}

function chatAvatar(chat: Chat, meId: number) {
  if (chat.isGroup) return null;
  const other = chat.members.find((m) => m.userId !== meId);
  return other?.user.image ?? null;
}

function unreadCount(chat: Chat, meId: number): number {
  const membership = chat.members.find((m) => m.userId === meId);
  if (!membership || !chat.lastMsg) return 0;
  if (!membership.lastReadId) return chat.lastMsg ? 1 : 0;
  return chat.lastMsg.id > membership.lastReadId ? 1 : 0;
}

interface ChatListProps {
  chats: Chat[];
  activeChatId: number | null;
  meId: number;
  users: ChatUser[];
  onSelect: (chatId: number) => void;
  onChatCreated: (chat: Chat) => void;
}

export function ChatList({ chats, activeChatId, meId, users, onSelect, onChatCreated }: ChatListProps) {
  const [newChatOpen, setNewChatOpen] = useState(false);

  return (
    <div className="flex flex-col h-full border-r">
      <div className="flex items-center justify-between px-3 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Mensajes</span>
        </div>
        <button
          onClick={() => setNewChatOpen(true)}
          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
          title="Nueva conversación"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {chats.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">No tenés conversaciones.</p>
            <button onClick={() => setNewChatOpen(true)} className="text-xs text-primary mt-1 hover:underline">
              Iniciar una
            </button>
          </div>
        ) : (
          chats.map((chat) => {
            const name = chatDisplayName(chat, meId);
            const avatar = chatAvatar(chat, meId);
            const unread = unreadCount(chat, meId);
            const lastText = chat.lastMsg?.text ?? null;

            return (
              <button
                key={chat.id}
                onClick={() => onSelect(chat.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left",
                  activeChatId === chat.id && "bg-muted"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : chat.isGroup ? (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn("text-sm truncate", unread > 0 ? "font-semibold" : "font-medium")}>{name}</p>
                    {chat.lastMsg && (
                      <span className="text-[10px] text-muted-foreground/50 shrink-0">
                        {new Date(chat.lastMsg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn("text-xs truncate", unread > 0 ? "text-foreground/80" : "text-muted-foreground")}>
                      {lastText ?? "Sin mensajes"}
                    </p>
                    {unread > 0 && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        users={users.filter((u) => u.id !== meId)}
        meId={meId}
        onCreated={(chat) => { onChatCreated(chat); onSelect(chat.id); setNewChatOpen(false); }}
      />
    </div>
  );
}
