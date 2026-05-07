"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewFiltersProps {
  mine: boolean;
  favoritesOnly: boolean;
}

export function OverviewFilters({ mine, favoritesOnly }: OverviewFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggle = (key: "lm" | "lf", currentValue: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!currentValue) params.set(key, "1");
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false } as any);
    const dbKey = key === "lm" ? "assignedToMeOnly" : "favoritesOnly";
    fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [dbKey]: !currentValue }),
    });
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => toggle("lm", mine)}
        title={mine ? "Todos los expedientes" : "Mis expedientes"}
        className={cn(
          "h-6 w-6 flex items-center justify-center rounded-md transition-all",
          mine
            ? "text-foreground bg-muted"
            : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
        )}
      >
        <User className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => toggle("lf", favoritesOnly)}
        title={favoritesOnly ? "Todos los expedientes" : "Solo destacados"}
        className={cn(
          "h-6 w-6 flex items-center justify-center rounded-md transition-all",
          favoritesOnly
            ? "text-amber-400"
            : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
        )}
      >
        <Star className={cn("h-3.5 w-3.5", favoritesOnly && "fill-amber-400")} />
      </button>
    </div>
  );
}
