/**
 * Para guardar: strip todos los puntos ("12.345/2020" → "12345/2020")
 */
export function normalizeOrder(raw: string): string {
  return raw.replace(/\./g, "").trim();
}

/**
 * Valida que el año (parte después de /) tenga exactamente 4 dígitos.
 * Retorna null si es válido, o el mensaje de error si no lo es.
 */
export function validateOrderYear(raw: string): string | null {
  const stripped = raw.replace(/\./g, "").trim();
  if (!stripped.includes("/")) return null;
  const year = stripped.split("/").pop() ?? "";
  if (!/^\d{4}$/.test(year)) {
    return `El año debe tener 4 dígitos (ej: ${stripped.split("/")[0]}/2005)`;
  }
  return null;
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
