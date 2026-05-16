"use client";

import { Activity } from "lucide-react";
import { ActivityItem } from "@/lib/activity-format";
import { ActivityFeed } from "@/components/shared/activity-feed";

interface UserActivitySectionProps {
  initialItems: ActivityItem[];
  initialNextCursor: number | null;
  totalCount: number;
}

export function UserActivitySection({ initialItems, initialNextCursor, totalCount }: UserActivitySectionProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border bg-card overflow-hidden">
      {/* Header fijo */}
      <div className="shrink-0 px-5 py-3.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground/60" />
          <p className="text-sm font-medium">Mi actividad</p>
        </div>
        {totalCount > 0 && (
          <span className="text-[10px] text-muted-foreground/50 bg-muted px-2 py-0.5 rounded-full">
            {totalCount} movimientos
          </span>
        )}
      </div>

      {/* Feed scrolleable */}
      <div className="flex-1 overflow-y-auto px-5 py-1">
        <ActivityFeed
          initialItems={initialItems}
          initialNextCursor={initialNextCursor}
          fetchUrl="/api/activity"
          showRecord
          emptyMessage="No tenés actividad registrada aún."
        />
      </div>
    </div>
  );
}
