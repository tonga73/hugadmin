import { Record } from "@/app/generated/prisma/client";
import { TRACING_OPTIONS } from "@/app/constants";

/**
 * Escapa caracteres especiales de regex
 */
export const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Construye un string de búsqueda (haystack) a partir de un record
 */
export const buildRecordHaystack = (record: Record): string => {
  const tracingLabel =
    TRACING_OPTIONS[record.tracing as keyof typeof TRACING_OPTIONS]?.label ||
    String(record.tracing || "");

  const defendants = Array.isArray(record.defendant)
    ? record.defendant.join(" ")
    : String(record.defendant || "");

  const prosecutors = Array.isArray(record.prosecutor)
    ? record.prosecutor.join(" ")
    : String(record.prosecutor || "");

  const insurances = Array.isArray(record.insurance)
    ? record.insurance.join(" ")
    : String(record.insurance || "");

  return (
    String(record.order) +
    " " +
    (record.name || "") +
    " " +
    tracingLabel +
    " " +
    defendants +
    " " +
    prosecutors +
    " " +
    insurances
  ).toLowerCase();
};

/**
 * Filtra records basándose en un query
 */
export const filterRecords = (
  records: Record[],
  query: string,
  exactMatch: boolean = false
): Record[] => {
  const normalized = query.trim();
  if (!normalized) return records;

  const terms = normalized
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  return records.filter((record) => {
    const haystack = buildRecordHaystack(record);

    if (!exactMatch) {
      // Fuzzy: cualquier término incluido
      return terms.some((t) => haystack.includes(t.toLowerCase()));
    }

    // Exact: match con word boundaries
    return terms.some((t) => {
      try {
        const re = new RegExp("\\b" + escapeRegExp(t.toLowerCase()) + "\\b");
        return re.test(haystack);
      } catch {
        return haystack.includes(t.toLowerCase());
      }
    });
  });
};

/**
 * Agrega records únicos a una lista existente
 */
export const mergeUniqueRecords = (
  existing: Record[],
  newRecords: Record[]
): Record[] => {
  const existingIds = new Set(existing.map((r) => Number(r.id)));
  const unique = newRecords.filter((r) => !existingIds.has(Number(r.id)));
  return [...existing, ...unique];
};

/**
 * Verifica si un record existe en una lista
 */
export const recordExists = (records: Record[], recordId: number): boolean =>
  records.some((r) => Number(r.id) === Number(recordId));

