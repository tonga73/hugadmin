"use client";

import { Activity } from "lucide-react";
import { ActivityItem } from "@/lib/activity-format";
import { ActivityFeed } from "@/components/shared/activity-feed";

interface UserActivitySectionProps {
  initialItems: ActivityItem[];
  initialNextCursor: number | null;
}

export function UserActivitySection({ initialItems, initialNextCursor }: UserActivitySectionProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-muted-foreground/60" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          Mi actividad
        </p>
      </div>
      <ActivityFeed
        initialItems={initialItems}
        initialNextCursor={initialNextCursor}
        fetchUrl="/api/activity"
        showRecord
        emptyMessage="No tenés actividad registrada aún."
      />
    </div>
  );
}
