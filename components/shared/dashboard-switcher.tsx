"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart2, Layers, Star, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardView = "OVERVIEW" | "STAGE" | "FOCUS" | "HYBRID";

const VIEWS: { value: DashboardView; icon: React.ElementType; label: string }[] = [
  { value: "OVERVIEW", icon: BarChart2, label: "Overview" },
  { value: "STAGE", icon: Layers, label: "Etapa" },
  { value: "FOCUS", icon: Star, label: "Focus" },
  { value: "HYBRID", icon: GitMerge, label: "Híbrido" },
];

export function DashboardSwitcher({ current }: { current: DashboardView }) {
  const router = useRouter();
  const [active, setActive] = useState<DashboardView>(current);
  const [switching, setSwitching] = useState(false);

  const switchTo = async (view: DashboardView) => {
    if (view === active || switching) return;
    setSwitching(true);
    setActive(view); // optimistic
    await fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardView: view }),
    });
    setSwitching(false);
    router.refresh();
  };

  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1.5 px-1">
        Vista
      </p>
      <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
        {VIEWS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            title={label}
            onClick={() => switchTo(value)}
            disabled={switching}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md transition-all text-[9px] font-medium",
              active === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground/50 hover:text-muted-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
