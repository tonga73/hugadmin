"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityItem, describeActivity, timeAgo } from "@/lib/activity-format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ActivityFeed } from "@/components/shared/activity-feed";

interface RecordHistorySectionProps {
  recordId: number;
  initialActivity: ActivityItem[];
  initialNextCursor: number | null;
}

function MiniAvatar({ user }: { user: ActivityItem["user"] }) {
  return (
    <div className={cn(
      "h-4 w-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center overflow-hidden",
      "bg-muted text-[8px] font-bold text-muted-foreground"
    )}>
      {user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" className="h-4 w-4 object-cover" />
      ) : (
        (user?.name ?? user?.email ?? "?")[0].toUpperCase()
      )}
    </div>
  );
}

export function RecordHistorySection({
  recordId,
  initialActivity,
  initialNextCursor,
}: RecordHistorySectionProps) {
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [nextCursor] = useState<number | null>(initialNextCursor);

  useEffect(() => {
    const handleUpdate = () => {
      fetch(`/api/records/${recordId}/activity?limit=25`)
        .then((r) => r.json())
        .then((data) => Array.isArray(data.items) && setActivity(data.items))
        .catch(() => {});
    };
    window.addEventListener("update-record", handleUpdate);
    return () => window.removeEventListener("update-record", handleUpdate);
  }, [recordId]);

  if (activity.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
          <History className="h-2.5 w-2.5" />
          Historial
        </p>
        <Sheet>
          <SheetTrigger asChild>
            <button className="text-[9px] text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              Ver todo
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
            <SheetHeader>
              <SheetTitle className="text-sm flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Historial completo
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              <ActivityFeed
                initialItems={initialActivity}
                initialNextCursor={nextCursor}
                fetchUrl={`/api/records/${recordId}/activity`}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-0 max-h-36 overflow-y-auto">
        {activity.slice(0, 8).map((a) => (
          <div key={a.id} className="flex items-start gap-1.5 py-1 border-b border-muted/50 last:border-0">
            <MiniAvatar user={a.user} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] leading-snug text-foreground/80 truncate">
                {describeActivity(a)}
              </p>
              <p className="text-[9px] text-muted-foreground/50">
                {a.user?.name ?? a.user?.email ?? "Sistema"}
              </p>
            </div>
            <span className="text-[9px] text-muted-foreground/40 shrink-0">{timeAgo(a.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
