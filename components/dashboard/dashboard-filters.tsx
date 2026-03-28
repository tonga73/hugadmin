"use client";

import { useRouter } from "next/navigation";
import { Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardFiltersProps {
  mine: boolean;
  favoritesOnly: boolean;
}

export function DashboardFilters({ mine, favoritesOnly }: DashboardFiltersProps) {
  const router = useRouter();

  const patch = async (update: { assignedToMeOnly?: boolean; favoritesOnly?: boolean }) => {
    await fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => patch({ assignedToMeOnly: !mine })}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all",
          mine
            ? "bg-blue-400/20 border-blue-400 text-blue-500"
            : "border-muted-foreground/25 text-muted-foreground/60 opacity-60 hover:opacity-90"
        )}
      >
        <User className="h-2.5 w-2.5" />
        Mis expedientes
      </button>
      <button
        onClick={() => patch({ favoritesOnly: !favoritesOnly })}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all",
          favoritesOnly
            ? "bg-amber-400/20 border-amber-400 text-amber-500"
            : "border-muted-foreground/25 text-muted-foreground/60 opacity-60 hover:opacity-90"
        )}
      >
        <Star className="h-2.5 w-2.5" />
        Destacados
      </button>
    </div>
  );
}
