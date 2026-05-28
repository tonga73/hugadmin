// app/constants/tracing.ts
// Orden: flujo natural del proceso pericial (inicio → cobro → cierre)
//
// Los colores son CSS custom properties definidas en globals.css.
// Light mode: L ~74-77% (claros).  Dark mode: L ~22-25% (oscuros).
// Mismos hues en ambos modos — paleta espejo. Ver globals.css para valores.

export const TRACING_OPTIONS: Record<
  string,
  { label: string; color: string }
> = {
  // — Etapa técnica —
  ACEPTA_CARGO:                   { label: "Acepta Cargo",             color: "var(--tracing-acepta)" },
  ACTO_PERICIAL_REALIZADO:        { label: "Acto Pericial",            color: "var(--tracing-acto)" },
  PERICIA_REALIZADA:              { label: "Pericia Realizada",        color: "var(--tracing-pericia)" },
  // — Etapa judicial —
  TRAMITE_EN_CAMARA:              { label: "Trámite en Cámara",        color: "var(--tracing-camara)" },
  SENTENCIA_O_CONVENIO_DE_PARTES: { label: "Sentencia / Convenio",     color: "var(--tracing-sentencia)" },
  // — Etapa de cobro —
  HONORARIOS_REGULADOS:           { label: "Honorarios Regulados",     color: "var(--tracing-honorarios)" },
  EN_TRATATIVA_DE_COBRO:          { label: "En Tratativa de Cobro",    color: "var(--tracing-tratativa)" },
  // — Escalada —
  INICIO_EJECUTIVO:               { label: "Inicio Ejecutivo",         color: "var(--tracing-ejecutivo)" },
  // — Terminales —
  COBRADO:                        { label: "Cobrado",                  color: "var(--tracing-cobrado)" },
  SIN_POSIBILIDAD_DE_COBRO:       { label: "Sin posibilidad de cobro", color: "var(--tracing-sincobro)" },
};
