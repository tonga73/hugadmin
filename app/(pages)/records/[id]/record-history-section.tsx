"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: number;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: number; name: string | null; email: string; image: string | null } | null;
}

const FIELD_LABELS: Record<string, string> = {
  tracing: "Estado",
  priority: "Prioridad",
  name: "Carátula",
  order: "Número",
};

const TRACING_LABELS: Record<string, string> = {
  ACEPTA_CARGO: "Acepta cargo",
  ACTO_PERICIAL_REALIZADO: "Acto pericial",
  PERICIA_REALIZADA: "Pericia realizada",
  SENTENCIA_O_CONVENIO_DE_PARTES: "Sentencia",
  HONORARIOS_REGULADOS: "Honorarios",
  EN_TRATATIVA_DE_COBRO: "En cobro",
  COBRADO: "Cobrado",
};

const PRIORITY_LABELS: Record<string, string> = {
  NULA: "Sin prioridad",
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
  INACTIVO: "Inactivo",
};

function formatValue(field: string | null, value: string | null) {
  if (!value) return "—";
  if (field === "tracing") return TRACING_LABELS[value] ?? value;
  if (field === "priority") return PRIORITY_LABELS[value] ?? value;
  return value.length > 40 ? value.slice(0, 40) + "…" : value;
}

function describeActivity(a: Activity) {
  if (a.action === "user_assigned") {
    return `Asignó a ${a.newValue ?? "usuario"}`;
  }
  if (a.action === "field_updated" && a.field) {
    const label = FIELD_LABELS[a.field] ?? a.field;
    return `${label}: ${formatValue(a.field, a.newValue)}`;
  }
  return a.action;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

interface RecordHistorySectionProps {
  recordId: number;
  initialActivity: Activity[];
}

export function RecordHistorySection({ recordId, initialActivity }: RecordHistorySectionProps) {
  const [activity, setActivity] = useState<Activity[]>(initialActivity);

  useEffect(() => {
    const handleUpdate = () => {
      fetch(`/api/records/${recordId}/activity`)
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setActivity(data))
        .catch(() => {});
    };
    window.addEventListener("update-record", handleUpdate);
    return () => window.removeEventListener("update-record", handleUpdate);
  }, [recordId]);

  if (activity.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
        <History className="h-2.5 w-2.5" />
        Historial
      </p>
      <div className="space-y-0 max-h-36 overflow-y-auto">
        {activity.map((a) => (
          <div key={a.id} className="flex items-start gap-1.5 py-1 border-b border-muted/50 last:border-0">
            <div className={cn(
              "h-4 w-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center",
              "bg-muted text-[8px] font-bold text-muted-foreground overflow-hidden"
            )}>
              {a.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.user.image} alt="" className="h-4 w-4 object-cover" />
              ) : (
                (a.user?.name ?? a.user?.email ?? "?")[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] leading-snug text-foreground/80 truncate">
                {describeActivity(a)}
              </p>
              <p className="text-[9px] text-muted-foreground/50">
                {a.user?.name ?? a.user?.email ?? "Sistema"}
              </p>
            </div>
            <span className="text-[9px] text-muted-foreground/40 shrink-0">{timeAgo(a.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
