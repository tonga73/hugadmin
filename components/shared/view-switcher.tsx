"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BarChart2, Star, SlidersHorizontal, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { useView } from "@/contexts/view-context";

type DashboardView = "OVERVIEW" | "FOCUS";
type FileCategory = "DRIVE" | "APARTADO" | "EXPEDIENTE";

interface Config {
  dashboardView: DashboardView;
  favoritesOnly: boolean;
  assignedToMeOnly: boolean;
  fileCategories: FileCategory[];
}

const DEFAULT_CONFIG: Config = {
  dashboardView: "OVERVIEW",
  favoritesOnly: false,
  assignedToMeOnly: false,
  fileCategories: [],
};

const VIEWS: {
  value: DashboardView;
  icon: React.ElementType;
  label: string;
  description: string;
}[] = [
  {
    value: "OVERVIEW",
    icon: BarChart2,
    label: "Overview",
    description: "Pipeline completo y stats globales. Ideal para supervisores.",
  },
  {
    value: "FOCUS",
    icon: Star,
    label: "Focus",
    description: "Solo tus expedientes destacados, ordenados por prioridad.",
  },
];

const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: "DRIVE", label: "Drive" },
  { value: "APARTADO", label: "Apartados" },
  { value: "EXPEDIENTE", label: "Expediente" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus-visible:outline-none",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-md",
          "transform transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

// Normalize DB value (HYBRID legacy) to one of the supported views
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
          setConfig({
            dashboardView: normalizeView(data.dashboardView ?? "OVERVIEW"),
            favoritesOnly: data.favoritesOnly ?? false,
            assignedToMeOnly: data.assignedToMeOnly ?? false,
            fileCategories: data.fileCategories ?? [],
          });
          // Sync DB config to URL if not already set (first visit, no URL params)
          const params = new URLSearchParams(window.location.search);
          let changed = false;
          const effectiveView = params.has("view")
            ? params.get("view")?.toUpperCase()
            : normalizeView(data.dashboardView ?? "OVERVIEW");
          if (effectiveView === "FOCUS") {
            setOpen(false);
            setIsFocus(true);
          } else {
            setIsFocus(false);
          }
          if (normalizeView(data.dashboardView ?? "OVERVIEW") === "FOCUS" && !params.has("view")) {
            params.set("view", "FOCUS");
            changed = true;
          }
          if ((data.assignedToMeOnly ?? false) && !params.has("lm")) {
            params.set("lm", "1");
            changed = true;
          }
          if ((data.favoritesOnly ?? false) && !params.has("lf")) {
            params.set("lf", "1");
            changed = true;
          }
          if (changed) {
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false } as any);
          }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to DB — always called for any config change
  const saveToDb = (update: Partial<Config>) => {
    fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
  };

  // Preserve sidebar filter params (lt, lp, lm, lf) when building new URL
  const buildUrl = (base: string, extra: Record<string, string>) => {
    const params = new URLSearchParams();
    // Preserve sidebar list filter params
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

  // Change dashboard view — saves + navigates (preserving sidebar filter params)
  const setView = (view: DashboardView) => {
    const next = { ...config, dashboardView: view };
    setConfig(next);
    saveToDb({ dashboardView: view });
    if (view === "FOCUS") { setOpen(false); setIsFocus(true); }
    else if (config.dashboardView === "FOCUS") { setOpen(true); setIsFocus(false); }
    if (pathname === "/") {
      startTransition(() =>
        router.push(buildUrl("/", { view }), { scroll: false } as any)
      );
    }
  };

  // Change a filter (favorites, mine, fileCategories) — saves to DB + updates URL
  const patchFilter = (update: Partial<Config>) => {
    const next = { ...config, ...update };
    setConfig(next);
    saveToDb(update);
  };

  // Toggle "Solo mis expedientes" — saves to DB AND updates URL
  const toggleMine = () => {
    const next = !config.assignedToMeOnly;
    patchFilter({ assignedToMeOnly: next });
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("lm", "1");
    else params.delete("lm");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false } as any);
  };

  // Toggle "Solo destacados" — saves to DB AND updates URL
  const toggleFavorites = () => {
    const next = !config.favoritesOnly;
    patchFilter({ favoritesOnly: next });
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("lf", "1");
    else params.delete("lf");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false } as any);
  };

  const toggleFileCategory = (cat: FileCategory) => {
    const next = config.fileCategories.includes(cat)
      ? config.fileCategories.filter((c) => c !== cat)
      : [...config.fileCategories, cat];
    patchFilter({ fileCategories: next });
  };

  const hasActiveFilters = config.favoritesOnly || config.assignedToMeOnly;

  if (!loaded) return null;

  return (
    <div className="flex items-center gap-1">
      {/* Mode tabs */}
      <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
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

      {/* Config sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            title="Configuración de vista"
            className={cn(
              "relative flex items-center justify-center h-7 w-7 rounded-md transition-colors",
              hasActiveFilters
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {hasActiveFilters && (
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
        </SheetTrigger>

        <SheetContent side="right" className="w-80 flex flex-col gap-0 p-0">
          <SheetHeader className="px-5 pt-5 pb-0">
            <SheetTitle className="text-sm">Configuración de vista</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {/* Dashboard mode */}
            <section className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Dashboard
              </p>
              <div className="space-y-1.5">
                {VIEWS.map(({ value, icon: Icon, label, description }) => (
                  <button
                    key={value}
                    onClick={() => setView(value)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                      config.dashboardView === value
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        config.dashboardView === value
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          config.dashboardView === value
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        {description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Lista filters — these filter the sidebar records list */}
            <section className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Filtros de lista
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Afectan los expedientes del panel lateral.
                </p>
              </div>

              {/* Assigned to me toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-sm">Solo mis expedientes</span>
                </div>
                <Toggle
                  checked={config.assignedToMeOnly}
                  onChange={toggleMine}
                />
              </div>

              {/* Favorites toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-sm">Solo destacados</span>
                </div>
                <Toggle
                  checked={config.favoritesOnly}
                  onChange={toggleFavorites}
                />
              </div>

              <p className="text-[10px] text-muted-foreground/60 leading-snug">
                Los filtros de estado y prioridad se configuran directamente en el panel de expedientes.
              </p>
            </section>

            {/* File categories */}
            <section className="space-y-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Archivos visibles
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Sin selección = todas las categorías.
                </p>
              </div>
              <div className="flex gap-1.5">
                {FILE_CATEGORIES.map(({ value, label }) => {
                  const active = config.fileCategories.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleFileCategory(value)}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted text-muted-foreground hover:border-muted-foreground/40"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
