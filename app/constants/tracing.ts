// app/constants/tracing.ts
// Orden: flujo natural del proceso pericial (inicio → cobro → cierre)
// Colores "dusty": saturación baja, legibles en light y dark mode

export const TRACING_OPTIONS: Record<
  string,
  { label: string; color: string; textColor: string }
> = {
  // — Etapa técnica (azul apagado) —
  ACEPTA_CARGO: {
    label: "Acepta Cargo",
    color: "#c4d8eb",
    textColor: "#1a3555",
  },
  ACTO_PERICIAL_REALIZADO: {
    label: "Acto Pericial",
    color: "#b5cde4",
    textColor: "#1a3050",
  },
  PERICIA_REALIZADA: {
    label: "Pericia Realizada",
    color: "#bfc4df",
    textColor: "#252860",
  },
  // — Etapa judicial (ámbar apagado) —
  TRAMITE_EN_CAMARA: {
    label: "Trámite en Cámara",
    color: "#ddd0a0",
    textColor: "#4a3208",
  },
  SENTENCIA_O_CONVENIO_DE_PARTES: {
    label: "Sentencia / Convenio",
    color: "#ddc4a0",
    textColor: "#4a2e08",
  },
  // — Etapa de cobro (verde apagado) —
  HONORARIOS_REGULADOS: {
    label: "Honorarios Regulados",
    color: "#c4d99b",
    textColor: "#1a3d20",
  },
  EN_TRATATIVA_DE_COBRO: {
    label: "En Tratativa de Cobro",
    color: "#9dc4b0",
    textColor: "#1a3d28",
  },
  // — Escalada (rosa-rojo apagado) —
  INICIO_EJECUTIVO: {
    label: "Inicio Ejecutivo",
    color: "#daa8a8",
    textColor: "#4a1818",
  },
  // — Terminales —
  COBRADO: {
    label: "Cobrado",
    color: "#8ec4aa",
    textColor: "#0d3325",
  },
  SIN_POSIBILIDAD_DE_COBRO: {
    label: "Sin posibilidad de cobro",
    color: "#c4c8cc",
    textColor: "#3a4045",
  },
};
