// app/constants/tracing.ts

export const TRACING_OPTIONS: Record<
  string,
  { label: string; color: string; textColor: string }
> = {
  ACEPTA_CARGO: {
    label: "Acepta Cargo",
    color: "#f6c86b", // dorado suave
    textColor: "#4a3200", // marrón oscuro
  },
  ACTO_PERICIAL_REALIZADO: {
    label: "Acto Pericial",
    color: "#a4cafe", // azul pastel
    textColor: "#1e3a8a", // azul profundo
  },
  PERICIA_REALIZADA: {
    label: "Pericia Realizada",
    color: "#7dd3b3", // verde menta
    textColor: "#064e3b", // verde oscuro
  },
  SENTENCIA_O_CONVENIO_DE_PARTES: {
    label: "Sentencia / Convenio",
    color: "#fca5a5", // rojo suave
    textColor: "#7f1d1d", // rojo oscuro
  },
  HONORARIOS_REGULADOS: {
    label: "Honorarios Regulados",
    color: "#c4b5fd", // lavanda clara
    textColor: "#4c1d95", // violeta profundo
  },
  EN_TRATATIVA_DE_COBRO: {
    label: "En Tratativa de Cobro",
    color: "#f9a8d4", // rosa suave
    textColor: "#831843", // rosa oscuro
  },
  TRAMITE_EN_CAMARA: {
    label: "Trámite en Cámara",
    color: "#fed7aa", // naranja suave (orange-200)
    textColor: "#7c2d12", // naranja oscuro (orange-900)
  },
  COBRADO: {
    label: "Cobrado",
    color: "#5eead4", // turquesa claro
    textColor: "#134e4a", // verde azulado oscuro
  },
};
