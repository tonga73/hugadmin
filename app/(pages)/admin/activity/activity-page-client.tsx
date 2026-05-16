"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ActivityItem } from "@/lib/activity-format";
import { ActivityFeed } from "@/components/shared/activity-feed";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  name: string | null;
  email: string;
}

interface ActivityPageClientProps {
  initialItems: ActivityItem[];
  initialNextCursor: number | null;
  users: User[];
}

export function ActivityPageClient({
  initialItems,
  initialNextCursor,
  users,
}: ActivityPageClientProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [items, setItems] = useState<ActivityItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<number | null>(initialNextCursor);
  const [isFetching, setIsFetching] = useState(false);

  const fetchUrl =
    selectedUserId === "all"
      ? "/api/activity"
      : `/api/activity?userId=${selectedUserId}`;

  useEffect(() => {
    if (selectedUserId === "all") {
      setItems(initialItems);
      setNextCursor(initialNextCursor);
      return;
    }
    setIsFetching(true);
    setItems([]);
    setNextCursor(null);
    fetch(`/api/activity?userId=${selectedUserId}&limit=25`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setNextCursor(data.nextCursor ?? null);
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  return (
    <div className="space-y-4">
      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
        <SelectTrigger className="w-48 h-8 text-xs">
          <SelectValue placeholder="Todos los usuarios" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los usuarios</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.name ?? u.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isFetching ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
        </div>
      ) : (
        <ActivityFeed
          key={selectedUserId}
          initialItems={items}
          initialNextCursor={nextCursor}
          fetchUrl={fetchUrl}
          showRecord
          emptyMessage="Sin actividad registrada."
        />
      )}
    </div>
  );
}
