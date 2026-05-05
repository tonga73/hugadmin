"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Chat } from "./chat-types";

export function ChatNavButton({ meId }: { meId: number }) {
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = (chats: Chat[]) => {
    setHasUnread(
      chats.some((c) => {
        const last = c.lastMsg;
        if (!last) return false;
        if (last.sender.id === meId) return false;
        return last.id > (c.lastReadId ?? 0);
      })
    );
  };

  useEffect(() => {
    fetch("/api/chats")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && checkUnread(data))
      .catch(() => {});

    const es = new EventSource("/api/chat/stream");
    es.addEventListener("message", () => {
      fetch("/api/chats")
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && checkUnread(data))
        .catch(() => {});
    });
    return () => es.close();
  }, [meId]);

  return (
    <Button variant="ghost" size="icon" asChild className="h-7 w-7 relative" title="Mensajes">
      <Link href="/chat">
        <MessageSquare className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
        )}
      </Link>
    </Button>
  );
}
