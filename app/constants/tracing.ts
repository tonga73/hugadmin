// app/constants/tracing.ts
export const TRACING_OPTIONS: Record<string, { label: string; color: string }> =
  {
    ACEPTA_CARGO: { label: "Acepta Cargo", color: "#f59e0b" },
    ACTO_PERICIAL_REALIZADO: { label: "Acto Pericial", color: "#3b82f6" },
    PERICIA_REALIZADA: { label: "Pericia Realizada", color: "#10b981" },
    SENTENCIA_O_CONVENIO_DE_PARTES: {
      label: "Sentencia / Convenio",
      color: "#ef4444",
    },
    HONORARIOS_REGULADOS: { label: "Honorarios Regulados", color: "#8b5cf6" },
    EN_TRATATIVA_DE_COBRO: { label: "En Tratativa de Cobro", color: "#f43f5e" },
    COBRADO: { label: "Cobrado", color: "#14b8a6" },
  };
