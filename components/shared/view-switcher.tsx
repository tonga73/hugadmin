"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BarChart2, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useView } from "@/contexts/view-context";

type DashboardView = "OVERVIEW" | "FOCUS";

interface Config {
  dashboardView: DashboardView;
}

const DEFAULT_CONFIG: Config = {
  dashboardView: "OVERVIEW",
};

const VIEWS: {
  value: DashboardView;
  icon: React.ElementType;
  label: string;
}[] = [
  { value: "OVERVIEW", icon: BarChart2, label: "Overview" },
  { value: "FOCUS", icon: Star, label: "Focus" },
];

function normalizeView(v: string): DashboardView {
  if (v === "FOCUS") return "FOCUS";
  return "OVERVIEW";
}

export function ViewSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { setOpen } = useSidebar();
  const { setIsFocus } = useView();

  useEffect(() => {
    fetch("/api/users/me/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const view = normalizeView(data.dashboardView ?? "OVERVIEW");
          setConfig({ dashboardView: view });
          const params = new URLSearchParams(window.location.search);
          if (view === "FOCUS") {
            setOpen(false);
            setIsFocus(true);
          } else {
            setIsFocus(false);
          }
          if (view === "FOCUS" && !params.has("view")) {
            params.set("view", "FOCUS");
            // Also sync mine/favorites from DB to URL if not already set
            if ((data.assignedToMeOnly ?? false) && !params.has("lm")) params.set("lm", "1");
            if ((data.favoritesOnly ?? false) && !params.has("lf")) params.set("lf", "1");
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false } as any);
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const buildUrl = (base: string, extra: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const key of ["lt", "lp", "lm", "lf"]) {
      const v = searchParams.get(key);
      if (v) params.set(key, v);
    }
    for (const [k, v] of Object.entries(extra)) {
      params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const setView = (view: DashboardView) => {
    setConfig({ dashboardView: view });
    fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardView: view }),
    });
    if (view === "FOCUS") { setOpen(false); setIsFocus(true); }
    else if (config.dashboardView === "FOCUS") { setOpen(true); setIsFocus(false); }
    if (pathname === "/") {
      startTransition(() =>
        router.push(buildUrl("/", { view }), { scroll: false } as any)
      );
    }
  };

  if (!loaded) return null;

  return (
    <div id="tour-view-switcher" className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
      {VIEWS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          title={label}
          disabled={isPending}
          onClick={() => setView(value)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all disabled:pointer-events-none",
            config.dashboardView === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {isPending && config.dashboardView === value ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          ) : (
            <Icon className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
