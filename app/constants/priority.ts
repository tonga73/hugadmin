// app/constants/priority.ts
// Paleta cálida en pastel suave: reconocible como rojo/naranja/etc. sin saturar la UI
export const PRIORITY_OPTIONS: Record<
  string,
  { label: string; color: string }
> = {
  NULA: { label: "Nula", color: "#c0c6cc" },       // gris frío — sin prioridad
  BAJA: { label: "Baja", color: "#a0bcd8" },        // azul desaturado — calma
  MEDIA: { label: "Media", color: "#d4c478" },      // ámbar suave — atención leve
  ALTA: { label: "Alta", color: "#d4a070" },        // terracota/naranja suave — atención
  URGENTE: { label: "Urgente", color: "#cc8888" },  // rojo apagado — urgencia
  INACTIVO: { label: "Inactivo", color: "#808890" }, // gris oscuro — desactivado
};
