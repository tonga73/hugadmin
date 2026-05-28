"use server";

import prisma from "@/lib/prisma";
import { Tracing } from "@/app/generated/prisma/enums";
import { TRACING_OPTIONS } from "@/app/constants";
import { unstable_cache } from "next/cache";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfig, getPrioritiesAboveMin } from "@/lib/user-config";
import { normalizeOrder } from "@/lib/record-number";

// Función interna sin caché
async function fetchRecords({
  cursor,
  take = 10,
  query,
  exactMatch = false,
  userFilters,
  assignedToUserId,
  priorityPreload = false,
}: {
  cursor?: number;
  take?: number;
  query?: string;
  exactMatch?: boolean;
  assignedToUserId?: number;
  priorityPreload?: boolean;
  userFilters?: {
    tracingFilter: string[];
    favoritesOnly: boolean;
    minPriority: string | null;
    hasApartado?: boolean;
  };
}) {
  let where: any = {};

  // Filtro por usuario asignado
  if (assignedToUserId) {
    where.RecordsAndUser = { some: { userId: assignedToUserId } };
  }

  // Aplicar filtros del usuario
  if (userFilters) {
    if (userFilters.tracingFilter.length > 0) {
      where.tracing = { in: userFilters.tracingFilter };
    }
    if (userFilters.favoritesOnly) {
      where.favorite = true;
    }
    if (userFilters.hasApartado) {
      where.files = { some: { category: "APARTADO" } };
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
      const nt = normalizeOrder(t);
      orConditions.push({
        order: exactMatch ? { equals: nt, mode: "insensitive" } : { contains: nt, mode: "insensitive" },
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

  // Priority preload: urgentes + altas fetched separately so they always appear
  // regardless of how long ago they were updated. Mirrors focus-dashboard.tsx server logic.
  if (priorityPreload && !query) {
    // Build base where without the priority constraint (minPriority)
    const baseWhere: any = {};
    if (assignedToUserId) baseWhere.RecordsAndUser = { some: { userId: assignedToUserId } };
    if (userFilters?.tracingFilter && userFilters.tracingFilter.length > 0)
      baseWhere.tracing = { in: userFilters.tracingFilter };
    if (userFilters?.favoritesOnly) baseWhere.favorite = true;
    if (userFilters?.hasApartado) baseWhere.files = { some: { category: "APARTADO" } };

    // Paginated where: minPriority but excluding urgente/alta (already handled above)
    const paginatedWhere = { ...baseWhere };
    if (userFilters?.minPriority) {
      const remaining = getPrioritiesAboveMin(userFilters.minPriority).filter(
        (p) => p !== "URGENTE" && p !== "ALTA"
      );
      if (remaining.length > 0) paginatedWhere.priority = { in: remaining };
      else paginatedWhere.priority = { in: [] }; // nothing to show in paginated
    } else {
      paginatedWhere.priority = { notIn: ["URGENTE", "ALTA"] };
    }

    const [urgentRecords, altaRecords, paginatedRecords] = await Promise.all([
      prisma.record.findMany({
        where: { ...baseWhere, priority: "URGENTE" },
        orderBy: { updatedAt: "asc" },
        take: 50,
      }),
      prisma.record.findMany({
        where: { ...baseWhere, priority: "ALTA" },
        orderBy: { updatedAt: "asc" },
        take: 100,
      }),
      prisma.record.findMany({
        where: paginatedWhere,
        ...(cursor && { skip: 1, cursor: { id: cursor } }),
        orderBy: { updatedAt: "desc" },
        take,
      }),
    ]);

    const priorityIds = new Set([
      ...urgentRecords.map((r) => r.id),
      ...altaRecords.map((r) => r.id),
    ]);
    const paginatedOthers = paginatedRecords.filter((r) => !priorityIds.has(r.id));
    const allRecords = [...urgentRecords, ...altaRecords, ...paginatedOthers];

    const serialize = (r: any) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    });

    return {
      records: allRecords.map(serialize),
      lastId: paginatedOthers.at(-1)?.id ?? null,
      hasMore: paginatedRecords.length === take,
    };
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
    config.tracingFilter.length > 0 || config.favoritesOnly || config.minPriority !== null || config.assignedToMeOnly;

  if (!hasFilters) return null;

  return {
    tracingFilter: config.tracingFilter as string[],
    favoritesOnly: config.favoritesOnly,
    minPriority: config.minPriority as string | null,
    assignedToMeOnly: config.assignedToMeOnly,
  };
}

// Resolve the current user's DB id (needed for "mine" filter)
async function resolveCurrentUserId(): Promise<number | undefined> {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return undefined;
  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true },
  });
  return user?.id ?? undefined;
}

export async function getRecords({
  cursor,
  take = 10,
  query,
  exactMatch = false,
  assignedToUserId,
  explicitFilters,
  priorityPreload = false,
}: {
  cursor?: number;
  take?: number;
  query?: string;
  exactMatch?: boolean;
  assignedToUserId?: number;
  priorityPreload?: boolean;
  explicitFilters?: {
    tracingFilter: string[];
    minPriority: string | null;
    mine: boolean;
    favoritesOnly: boolean;
    apartadoOnly?: boolean;
  };
}) {
  // Explicit filters (URL-driven): bypass DB config read
  if (explicitFilters !== undefined) {
    const hasFilters =
      explicitFilters.tracingFilter.length > 0 ||
      explicitFilters.minPriority !== null ||
      explicitFilters.mine ||
      explicitFilters.favoritesOnly ||
      !!explicitFilters.apartadoOnly;

    let resolvedAssignedToUserId = assignedToUserId;
    if (explicitFilters.mine && !resolvedAssignedToUserId) {
      resolvedAssignedToUserId = await resolveCurrentUserId();
    }

    if (hasFilters || resolvedAssignedToUserId) {
      return fetchRecords({
        cursor,
        take,
        query,
        exactMatch,
        priorityPreload,
        userFilters: hasFilters
          ? {
              tracingFilter: explicitFilters.tracingFilter,
              favoritesOnly: explicitFilters.favoritesOnly,
              minPriority: explicitFilters.minPriority,
              hasApartado: !!explicitFilters.apartadoOnly,
            }
          : undefined,
        assignedToUserId: resolvedAssignedToUserId,
      });
    }
    // No filters: use shared cache (priorityPreload still applies)
    if (priorityPreload) return fetchRecords({ cursor, take, query, exactMatch, priorityPreload });
    if (cursor) return fetchRecords({ cursor, take, query, exactMatch });
    if (query?.trim()) return getCachedSearchResults(query.trim(), take, exactMatch);
    return getCachedRecords(undefined, take);
  }

  // DB-driven filters (used by AppSidebar SSR and polling refresh)
  const userFilters = await resolveUserFilters();
  let resolvedAssignedToUserId = assignedToUserId;
  if (userFilters?.assignedToMeOnly && !resolvedAssignedToUserId) {
    resolvedAssignedToUserId = await resolveCurrentUserId();
  }
  if (userFilters || resolvedAssignedToUserId) {
    return fetchRecords({ cursor, take, query, exactMatch, userFilters: userFilters ?? undefined, assignedToUserId: resolvedAssignedToUserId });
  }

  // Without filters: use shared cache
  if (cursor) return fetchRecords({ cursor, take, query, exactMatch });
  if (query?.trim()) return getCachedSearchResults(query.trim(), take, exactMatch);
  return getCachedRecords(undefined, take);
}
