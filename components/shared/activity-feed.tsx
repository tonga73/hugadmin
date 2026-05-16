"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ActivityItem, describeActivity, timeAgo } from "@/lib/activity-format";
import { formatOrder } from "@/lib/record-number";
import { cn } from "@/lib/utils";

interface ActivityFeedResponse {
  items: ActivityItem[];
  nextCursor: number | null;
  hasMore: boolean;
}

interface ActivityFeedProps {
  initialItems: ActivityItem[];
  initialNextCursor: number | null;
  fetchUrl: string;
  showRecord?: boolean;
  emptyMessage?: string;
}

function Avatar({ user }: { user: ActivityItem["user"] }) {
  return (
    <div className={cn(
      "h-6 w-6 rounded-full shrink-0 flex items-center justify-center overflow-hidden",
      "bg-muted text-[9px] font-bold text-muted-foreground"
    )}>
      {user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" className="h-6 w-6 object-cover" />
      ) : (
        (user?.name ?? user?.email ?? "?")[0].toUpperCase()
      )}
    </div>
  );
}

export function ActivityFeed({
  initialItems,
  initialNextCursor,
  fetchUrl,
  showRecord = false,
  emptyMessage = "Sin actividad registrada.",
}: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || nextCursor === null) return;
    setIsLoading(true);
    try {
      const sep = fetchUrl.includes("?") ? "&" : "?";
      const res = await fetch(`${fetchUrl}${sep}cursor=${nextCursor}&limit=25`);
      if (!res.ok) return;
      const data: ActivityFeedResponse = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
    }
  }, [fetchUrl, isLoading, nextCursor]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  if (items.length === 0 && !isLoading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-0">
      {items.map((a) => (
        <div key={a.id} className="flex items-start gap-2.5 py-2.5 border-b border-muted/50 last:border-0">
          <Avatar user={a.user} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-foreground/80 truncate">
                {a.user?.name ?? a.user?.email ?? "Sistema"}
              </span>
              {showRecord && a.record && (
                <>
                  <span className="text-[10px] text-muted-foreground/50">·</span>
                  <Link
                    href={`/records/${a.record.id}`}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors truncate"
                  >
                    {formatOrder(a.record.order)} {a.record.name}
                  </Link>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{describeActivity(a)}</p>
          </div>
          <span className="text-[10px] text-muted-foreground/40 shrink-0 mt-0.5">{timeAgo(a.createdAt)}</span>
        </div>
      ))}

      <div ref={sentinelRef} className="py-2 flex justify-center">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />}
        {!isLoading && nextCursor === null && items.length > 0 && (
          <span className="text-[10px] text-muted-foreground/30">Fin del historial</span>
        )}
      </div>
    </div>
  );
}
