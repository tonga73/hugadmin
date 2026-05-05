"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, FileText, MessageSquare, UserPlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: number;
  type: "RECORD_ASSIGNED" | "RECORD_UPDATED" | "CHAT_MESSAGE";
  title: string;
  body: string;
  entityId: number | null;
  read: boolean;
  createdAt: string;
}

const ICONS = {
  RECORD_ASSIGNED: UserPlus,
  RECORD_UPDATED: FileText,
  CHAT_MESSAGE: MessageSquare,
} as const;

const LINKS: Record<Notification["type"], (id: number | null) => string> = {
  RECORD_ASSIGNED: (id) => (id ? `/records/${id}` : "/"),
  RECORD_UPDATED: (id) => (id ? `/records/${id}` : "/"),
  CHAT_MESSAGE: () => "/chat",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 60s as fallback
    const poll = setInterval(fetchNotifications, 60000);

    // Also listen to SSE stream for real-time
    const es = new EventSource("/api/chat/stream");
    esRef.current = es;
    es.addEventListener("notification", () => fetchNotifications());

    return () => {
      clearInterval(poll);
      es.close();
    };
  }, []);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unread > 0) {
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await fetch("/api/notifications/read-all", { method: "POST" });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <p className="text-xs font-semibold">Notificaciones</p>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={async () => {
                setUnread(0);
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                await fetch("/api/notifications/read-all", { method: "POST" });
              }}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todo como leído
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Sin notificaciones</p>
          ) : (
            notifications.map((n) => {
              const Icon = ICONS[n.type];
              const href = LINKS[n.type](n.entityId);
              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium leading-snug">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug truncate">{n.body}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">
                    {timeAgo(n.createdAt)}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
