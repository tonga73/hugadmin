"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  Layers,
  Star,
  GitMerge,
  ChevronDown,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { PRIORITY_OPTIONS } from "@/app/constants/priority";

type DashboardView = "OVERVIEW" | "STAGE" | "FOCUS" | "HYBRID";
type Priority = "NULA" | "BAJA" | "MEDIA" | "ALTA" | "URGENTE" | "INACTIVO";

interface Config {
  dashboardView: DashboardView;
  tracingFilter: string[];
  favoritesOnly: boolean;
  minPriority: Priority | null;
}

const VIEWS: { value: DashboardView; icon: React.ElementType; label: string }[] = [
  { value: "OVERVIEW", icon: BarChart2, label: "Overview" },
  { value: "STAGE", icon: Layers, label: "Etapa" },
  { value: "FOCUS", icon: Star, label: "Focus" },
  { value: "HYBRID", icon: GitMerge, label: "Híbrido" },
];

const PRIORITY_ORDER: Priority[] = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

export function SidebarConfig({
  initial,
  isAdmin,
}: {
  initial: Config;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<Config>(initial);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const patch = async (update: Partial<Config>) => {
    const next = { ...config, ...update };
    setConfig(next);
    await fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    router.refresh();
  };

  const toggleTracing = (key: string) => {
    const next = config.tracingFilter.includes(key)
      ? config.tracingFilter.filter((k) => k !== key)
      : [...config.tracingFilter, key];
    patch({ tracingFilter: next });
  };

  const hasActiveFilters =
    config.tracingFilter.length > 0 ||
    config.favoritesOnly ||
    config.minPriority !== null;

  return (
    <div className="space-y-2 px-1">
      {/* Mode switcher */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1.5">
          Vista
        </p>
        <div className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
          {VIEWS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              title={label}
              onClick={() => patch({ dashboardView: value })}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md transition-all text-[9px] font-medium",
                config.dashboardView === value
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

      {/* Filters */}
      <div>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-1 w-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
        >
          <ChevronDown
            className={cn(
              "h-2.5 w-2.5 transition-transform",
              filtersOpen && "rotate-180"
            )}
          />
          Filtros
          {hasActiveFilters && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </button>

        {filtersOpen && (
          <div className="mt-2 space-y-2">
            {/* Tracing pills */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(TRACING_OPTIONS).map(([key, opt]) => {
                const active = config.tracingFilter.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleTracing(key)}
                    title={opt.label}
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[9px] font-medium border transition-all",
                      active ? "opacity-100" : "opacity-30 hover:opacity-60"
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

            {/* Favorites */}
            <button
              onClick={() => patch({ favoritesOnly: !config.favoritesOnly })}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium border transition-all",
                config.favoritesOnly
                  ? "bg-amber-400/20 border-amber-400 text-amber-500"
                  : "border-muted-foreground/20 text-muted-foreground/50 hover:border-muted-foreground/40"
              )}
            >
              <Star className="h-2.5 w-2.5" />
              Solo destacados
            </button>

            {/* Min priority */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => patch({ minPriority: null })}
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[9px] border transition-all",
                  config.minPriority === null
                    ? "bg-muted border-muted-foreground/40 text-foreground font-medium"
                    : "border-muted-foreground/20 text-muted-foreground/40 hover:opacity-70"
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
                      "px-1.5 py-0.5 rounded-full text-[9px] border transition-all",
                      active ? "font-medium" : "opacity-35 hover:opacity-70"
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
        )}
      </div>

      {/* Bottom links */}
      <div className="flex items-center gap-3 pt-0.5">
        <a
          href="/settings"
          className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <Settings className="h-3 w-3" />
          Configuración
        </a>
        {isAdmin && (
          <a
            href="/admin/users"
            className="flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors ml-auto"
          >
            <Users className="h-3 w-3" />
            Usuarios
          </a>
        )}
      </div>
    </div>
  );
}
