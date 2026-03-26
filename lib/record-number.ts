/**
 * Para guardar: strip todos los puntos ("12.345/2020" → "12345/2020")
 */
export function normalizeOrder(raw: string): string {
  return raw.replace(/\./g, "").trim();
}

/**
 * Para mostrar: insertar punto cada 3 dígitos antes de '/'
 * "12345/2020" → "12.345/2020"  |  "890/2020" → "890/2020"
 */
export function formatOrder(raw: string): string {
  const slash = raw.indexOf("/");
  const numPart = slash !== -1 ? raw.slice(0, slash) : raw;
  const rest = slash !== -1 ? raw.slice(slash) : "";
  return numPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + rest;
}
