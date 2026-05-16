export const FIELD_LABELS: Record<string, string> = {
  tracing: "Estado",
  priority: "Prioridad",
  name: "Carátula",
  order: "Número",
};

export const TRACING_LABELS: Record<string, string> = {
  ACEPTA_CARGO: "Acepta cargo",
  ACTO_PERICIAL_REALIZADO: "Acto pericial",
  PERICIA_REALIZADA: "Pericia realizada",
  SENTENCIA_O_CONVENIO_DE_PARTES: "Sentencia",
  HONORARIOS_REGULADOS: "Honorarios",
  EN_TRATATIVA_DE_COBRO: "En cobro",
  TRAMITE_EN_CAMARA: "Trámite en cámara",
  COBRADO: "Cobrado",
};

export const PRIORITY_LABELS: Record<string, string> = {
  NULA: "Sin prioridad",
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
  INACTIVO: "Inactivo",
};

function formatValue(field: string | null, value: string | null, maxLen = 40) {
  if (!value) return "—";
  if (field === "tracing") return TRACING_LABELS[value] ?? value;
  if (field === "priority") return PRIORITY_LABELS[value] ?? value;
  return value.length > maxLen ? value.slice(0, maxLen) + "…" : value;
}

// Keep for external callers that only need the new value
export function formatActivityValue(field: string | null, value: string | null) {
  return formatValue(field, value);
}

export interface ActivityItem {
  id: number;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: { id: number; name: string | null; email: string; image: string | null } | null;
  record?: { id: number; name: string; order: string } | null;
}

export function describeActivity(a: ActivityItem) {
  if (a.action === "user_assigned") return `Asignó a ${a.newValue ?? "usuario"}`;
  if (a.action === "field_updated" && a.field) {
    const label = FIELD_LABELS[a.field] ?? a.field;
    // Text fields: compact truncation so the arrow fits on one line
    const maxLen = a.field === "name" ? 25 : 40;
    const oldStr = a.oldValue ? formatValue(a.field, a.oldValue, maxLen) : null;
    const newStr = formatValue(a.field, a.newValue, maxLen);
    return oldStr ? `${label}: ${oldStr} → ${newStr}` : `${label}: ${newStr}`;
  }
  return a.action;
}

export function timeAgo(dateStr: string) {
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
