"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, Layers, Star, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { PRIORITY_OPTIONS } from "@/app/constants/priority";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type DashboardView = "OVERVIEW" | "STAGE" | "FOCUS";
type Priority = "NULA" | "BAJA" | "MEDIA" | "ALTA" | "URGENTE" | "INACTIVO";
type FileCategory = "DRIVE" | "APARTADO" | "EXPEDIENTE";

interface Config {
  dashboardView: DashboardView;
  tracingFilter: string[];
  favoritesOnly: boolean;
  minPriority: Priority | null;
  fileCategories: FileCategory[];
}

const DEFAULT_CONFIG: Config = {
  dashboardView: "OVERVIEW",
  tracingFilter: [],
  favoritesOnly: false,
  minPriority: null,
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
    value: "STAGE",
    icon: Layers,
    label: "Mi etapa",
    description: "Expedientes filtrados a tus estados asignados, por prioridad.",
  },
  {
    value: "FOCUS",
    icon: Star,
    label: "Focus",
    description: "Solo tus expedientes destacados, ordenados por prioridad.",
  },
];

const PRIORITY_ORDER: Priority[] = ["BAJA", "MEDIA", "ALTA", "URGENTE"];
const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: "DRIVE", label: "Drive" },
  { value: "APARTADO", label: "Apartados" },
  { value: "EXPEDIENTE", label: "Expediente" },
];

// Normalize DB value (HYBRID legacy) to one of the 3 supported views
function normalizeView(v: string): DashboardView {
  if (v === "STAGE") return "STAGE";
  if (v === "FOCUS") return "FOCUS";
  return "OVERVIEW";
}

export function ViewSwitcher() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/users/me/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setConfig({
            dashboardView: normalizeView(data.dashboardView ?? "OVERVIEW"),
            tracingFilter: data.tracingFilter ?? [],
            favoritesOnly: data.favoritesOnly ?? false,
            minPriority: data.minPriority ?? null,
            fileCategories: data.fileCategories ?? [],
          });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const patch = async (update: Partial<Config>) => {
    const next = { ...config, ...update };
    setConfig(next);
    await fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    startTransition(() => router.refresh());
  };

  const toggleTracing = (key: string) => {
    const next = config.tracingFilter.includes(key)
      ? config.tracingFilter.filter((k) => k !== key)
      : [...config.tracingFilter, key];
    patch({ tracingFilter: next });
  };

  const toggleFileCategory = (cat: FileCategory) => {
    const next = config.fileCategories.includes(cat)
      ? config.fileCategories.filter((c) => c !== cat)
      : [...config.fileCategories, cat];
    patch({ fileCategories: next });
  };

  const hasActiveFilters =
    config.tracingFilter.length > 0 ||
    config.favoritesOnly ||
    config.minPriority !== null;

  if (!loaded) return null;

  return (
    <div className="flex items-center gap-1">
      {/* Mode tabs */}
      <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
        {VIEWS.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            title={label}
            onClick={() => patch({ dashboardView: value })}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
              config.dashboardView === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Config sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            title="Filtros y configuración"
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

          {/* Scrollable body */}
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
                    onClick={() => patch({ dashboardView: value })}
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

            {/* Tracing */}
            <section className="space-y-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Estados visibles
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Sin selección = todos los estados.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(TRACING_OPTIONS).map(([key, opt]) => {
                  const active = config.tracingFilter.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleTracing(key)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all",
                        active ? "opacity-100" : "opacity-35 hover:opacity-60"
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: opt.color,
                              color: opt.textColor,
                              borderColor: opt.color,
                            }
                          : { borderColor: opt.color, color: opt.textColor }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Filters */}
            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Filtros
              </p>
              {/* Favorites toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-sm">Solo destacados</span>
                </div>
                <button
                  onClick={() => patch({ favoritesOnly: !config.favoritesOnly })}
                  className={cn(
                    "w-9 h-5 rounded-full transition-colors relative shrink-0",
                    config.favoritesOnly ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      config.favoritesOnly ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
              {/* Min priority */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Prioridad mínima</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => patch({ minPriority: null })}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs border transition-all",
                      config.minPriority === null
                        ? "bg-muted border-muted-foreground/40 font-medium"
                        : "border-muted text-muted-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    Todas
                  </button>
                  {PRIORITY_ORDER.map((p) => {
                    const opt = PRIORITY_OPTIONS[p];
                    const active = config.minPriority === p;
                    return (
                      <button
                        key={p}
                        onClick={() => patch({ minPriority: p })}
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs border transition-all",
                          active ? "font-medium" : "opacity-40 hover:opacity-70"
                        )}
                        style={
                          active
                            ? {
                                backgroundColor: opt.color,
                                borderColor: opt.color,
                                color: "#1a1a1a",
                              }
                            : { borderColor: opt.color, color: opt.color }
                        }
                      >
                        {opt.label}+
                      </button>
                    );
                  })}
                </div>
              </div>
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
