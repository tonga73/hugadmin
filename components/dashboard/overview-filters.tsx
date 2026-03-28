"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
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
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => toggle("lm", mine)}
        className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-medium border border-muted-foreground/40 transition-all",
          mine ? "opacity-100 bg-muted-foreground/20" : "opacity-55 hover:opacity-75"
        )}
      >
        Mis expedientes
      </button>
      <button
        onClick={() => toggle("lf", favoritesOnly)}
        className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-400/60 text-amber-500 transition-all flex items-center gap-0.5",
          favoritesOnly ? "opacity-100 bg-amber-400/15" : "opacity-55 hover:opacity-75"
        )}
      >
        <Star className={cn("h-2.5 w-2.5", favoritesOnly && "fill-amber-400")} />
        Destacados
      </button>
    </div>
  );
}
