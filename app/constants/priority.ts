// app/constants/priority.ts
export const PRIORITY_OPTIONS: Record<
  string,
  { label: string; color: string }
> = {
  NULA: { label: "Nula", color: "#94a3b8" }, // gris suave — sin prioridad
  BAJA: { label: "Baja", color: "#60a5fa" }, // azul pastel — baja prioridad
  MEDIA: { label: "Media", color: "#fcd34d" }, // amarillo pastel — media prioridad
  ALTA: { label: "Alta", color: "#f97316" }, // naranja pastel — alta prioridad
  URGENTE: { label: "Urgente", color: "#ef4444" }, // rojo pastel — urgente
  INACTIVO: { label: "Inactivo", color: "#94a3b8" }, // gris — estado desactivado
};
