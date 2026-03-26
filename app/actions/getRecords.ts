"use server";

import prisma from "@/lib/prisma";
import { Tracing } from "@/app/generated/prisma/enums";
import { TRACING_OPTIONS } from "@/app/constants";
import { unstable_cache } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfig, getPrioritiesAboveMin } from "@/lib/user-config";

// Función interna sin caché
async function fetchRecords({
  cursor,
  take = 10,
  query,
  exactMatch = false,
  userFilters,
}: {
  cursor?: number;
  take?: number;
  query?: string;
  exactMatch?: boolean;
  userFilters?: {
    tracingFilter: string[];
    favoritesOnly: boolean;
    minPriority: string | null;
  };
}) {
  let where: any = {};

  // Aplicar filtros del usuario
  if (userFilters) {
    if (userFilters.tracingFilter.length > 0) {
      where.tracing = { in: userFilters.tracingFilter };
    }
    if (userFilters.favoritesOnly) {
      where.favorite = true;
    }
    if (userFilters.minPriority) {
      const priorities = getPrioritiesAboveMin(userFilters.minPriority);
      if (priorities.length > 0) {
        where.priority = { in: priorities };
      }
    }
  }

  // Construir filtro de búsqueda (se combina con AND con los filtros de usuario)
  if (query && query.trim()) {
    const terms = query.trim().split(/\s+/).filter(Boolean);

    const getTracingEnumKeys = (searchTerm: string): string[] => {
      const normalized = searchTerm.toUpperCase();
      return Object.entries(Tracing)
        .filter(([key]) => {
          if (normalized === key) return true;
          if (!exactMatch && key.includes(normalized)) return true;
          return false;
        })
        .map(([key]) => key);
    };

    const getTracingByLabel = (searchTerm: string): string[] => {
      const normalized = searchTerm.toLowerCase();
      return Object.entries(TRACING_OPTIONS)
        .filter(([_, opt]) => {
          if (exactMatch && opt.label.toLowerCase() === normalized) return true;
          if (!exactMatch && opt.label.toLowerCase().includes(normalized)) return true;
          return false;
        })
        .map(([key]) => key);
    };

    const orConditions: any[] = [];
    terms.forEach((t) => {
      orConditions.push({
        order: exactMatch ? { equals: t, mode: "insensitive" } : { contains: t, mode: "insensitive" },
      });
      orConditions.push({
        name: exactMatch ? { equals: t, mode: "insensitive" } : { contains: t, mode: "insensitive" },
      });
    });

    terms.forEach((t) => {
      const allTracingKeys = [...new Set([...getTracingEnumKeys(t), ...getTracingByLabel(t)])];
      allTracingKeys.forEach((key) => {
        orConditions.push({ tracing: { equals: key as any } });
      });
    });

    terms.forEach((t) => {
      orConditions.push({ defendant: { has: t } });
      orConditions.push({ prosecutor: { has: t } });
      orConditions.push({ insurance: { has: t } });
    });

    if (orConditions.length > 0) {
      // Merge with existing user filters using AND
      const searchFilter = { OR: orConditions };
      where = Object.keys(where).length > 0 ? { AND: [where, searchFilter] } : searchFilter;
    }
  }

  const records = await prisma.record.findMany({
    take,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { updatedAt: "desc" },
    ...(Object.keys(where).length > 0 ? { where } : {}),
  });

  const lastId = records.at(-1)?.id ?? null;
  const hasMore = records.length === take;

  const serializedRecords = records.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return { records: serializedRecords, lastId, hasMore };
}

// Cache compartido (sin filtros de usuario)
const getCachedRecords = unstable_cache(
  async (cursor?: number, take?: number) => fetchRecords({ cursor, take }),
  ["records-list"],
  { revalidate: 30, tags: ["records"] }
);

const getCachedSearchResults = unstable_cache(
  async (query: string, take: number, exactMatch: boolean) =>
    fetchRecords({ query, take, exactMatch }),
  ["records-search"],
  { revalidate: 60, tags: ["records"] }
);

// Resolve user filters from session
async function resolveUserFilters() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return null;

  const config = await getUserViewConfig(sessionUser.email);
  if (!config) return null;

  const hasFilters =
    config.tracingFilter.length > 0 || config.favoritesOnly || config.minPriority !== null;

  if (!hasFilters) return null;

  return {
    tracingFilter: config.tracingFilter as string[],
    favoritesOnly: config.favoritesOnly,
    minPriority: config.minPriority as string | null,
  };
}

export async function getRecords({
  cursor,
  take = 10,
  query,
  exactMatch = false,
}: {
  cursor?: number;
  take?: number;
  query?: string;
  exactMatch?: boolean;
}) {
  const userFilters = await resolveUserFilters();

  // With user filters: skip cache (user-specific results)
  if (userFilters) {
    return fetchRecords({ cursor, take, query, exactMatch, userFilters });
  }

  // Without filters: use shared cache
  if (cursor) return fetchRecords({ cursor, take, query, exactMatch });
  if (query?.trim()) return getCachedSearchResults(query.trim(), take, exactMatch);
  return getCachedRecords(undefined, take);
}
