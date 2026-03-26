"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, BarChart2, Star, Layers, User } from "lucide-react";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { PRIORITY_OPTIONS } from "@/app/constants/priority";
import { cn } from "@/lib/utils";

type DashboardView = "OVERVIEW" | "STAGE" | "FOCUS";
type FileCategory = "DRIVE" | "APARTADO" | "EXPEDIENTE";
type Priority = "NULA" | "BAJA" | "MEDIA" | "ALTA" | "URGENTE" | "INACTIVO";

interface Config {
  dashboardView: DashboardView;
  tracingFilter: string[];
  favoritesOnly: boolean;
  minPriority: Priority | null;
  fileCategories: FileCategory[];
}

const DASHBOARD_OPTIONS: { value: DashboardView; label: string; icon: React.ElementType; description: string }[] = [
  { value: "OVERVIEW", icon: BarChart2, label: "Overview", description: "Pipeline completo y stats globales. Para supervisores." },
  { value: "STAGE", icon: Layers, label: "Mi etapa", description: "Expedientes filtrados a los estados asignados, por prioridad." },
  { value: "FOCUS", icon: Star, label: "Focus", description: "Solo expedientes destacados, ordenados por prioridad." },
];

const PRIORITY_ORDER: Priority[] = ["NULA", "BAJA", "MEDIA", "ALTA", "URGENTE"];
const FILE_CATEGORIES: { value: FileCategory; label: string }[] = [
  { value: "DRIVE", label: "Drive" },
  { value: "APARTADO", label: "Apartados" },
  { value: "EXPEDIENTE", label: "Expediente" },
];

export function AdminUserConfigForm({
  userId,
  userName,
  userEmail,
  userImage,
  initialConfig,
}: {
  userId: number;
  userName: string | null;
  userEmail: string;
  userImage: string | null;
  initialConfig: Config;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<Config>(initialConfig);
  const [saving, setSaving] = useState(false);

  const toggleTracing = (key: string) => {
    setConfig((prev) => ({
      ...prev,
      tracingFilter: prev.tracingFilter.includes(key)
        ? prev.tracingFilter.filter((t) => t !== key)
        : [...prev.tracingFilter, key],
    }));
  };

  const toggleFileCategory = (cat: FileCategory) => {
    setConfig((prev) => ({
      ...prev,
      fileCategories: prev.fileCategories.includes(cat)
        ? prev.fileCategories.filter((c) => c !== cat)
        : [...prev.fileCategories, cat],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{userName ?? userEmail}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Dashboard</p>
          <div className="grid grid-cols-2 gap-2">
            {DASHBOARD_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setConfig((prev) => ({ ...prev, dashboardView: opt.value }))}
                  className={cn(
                    "flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all",
                    config.dashboardView === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Tracing */}
        <section className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Estados visibles</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sin selección = ver todos los estados.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TRACING_OPTIONS).map(([key, opt]) => {
              const active = config.tracingFilter.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleTracing(key)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    active ? "opacity-100" : "opacity-40 hover:opacity-70"
                  )}
                  style={
                    active
                      ? { backgroundColor: opt.color, color: opt.textColor, borderColor: opt.color }
                      : { borderColor: opt.color, color: opt.textColor }
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Favorites + priority */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Filtros adicionales</p>
          <Card className="p-3 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">Solo destacados</p>
                <p className="text-[11px] text-muted-foreground">Ver únicamente expedientes marcados con ★</p>
              </div>
              <button
                onClick={() => setConfig((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
                className={cn(
                  "w-9 h-5 rounded-full transition-colors relative",
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
            </label>
            <div>
              <p className="text-sm font-medium mb-1.5">Prioridad mínima</p>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setConfig((prev) => ({ ...prev, minPriority: null }))}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs border transition-all",
                    config.minPriority === null
                      ? "bg-muted border-muted-foreground/40 font-medium"
                      : "border-muted hover:border-muted-foreground/30 text-muted-foreground"
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
                      onClick={() => setConfig((prev) => ({ ...prev, minPriority: p }))}
                      className={cn("px-2.5 py-1 rounded-full text-xs border transition-all", active ? "font-medium" : "opacity-50 hover:opacity-80")}
                      style={active ? { backgroundColor: opt.color, borderColor: opt.color, color: "#1a1a1a" } : { borderColor: opt.color, color: opt.color }}
                    >
                      {opt.label}+
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>

        {/* File categories */}
        <section className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Archivos visibles</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sin selección = ver todas las categorías.</p>
          </div>
          <div className="flex gap-2">
            {FILE_CATEGORIES.map(({ value, label }) => {
              const active = config.fileCategories.includes(value);
              return (
                <button
                  key={value}
                  onClick={() => toggleFileCategory(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-muted text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
