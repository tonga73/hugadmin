"use server";

import prisma from "@/lib/prisma";
import { Tracing } from "@/app/generated/prisma/enums";
import { TRACING_OPTIONS } from "@/app/constants";

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
  // Construir filtro de búsqueda
  let where: any = {};
  if (query && query.trim()) {
    const terms = query.trim().split(/\s+/).filter(Boolean);

    // Encontrar enum keys que coincidan con el término (exacto o partial)
    const getTracingEnumKeys = (searchTerm: string): string[] => {
      const normalized = searchTerm.toUpperCase();
      return Object.entries(Tracing)
        .filter(([key]) => {
          // Búsqueda exacta del enum key
          if (normalized === key) return true;
          // Búsqueda partial del enum key
          if (!exactMatch && key.includes(normalized)) return true;
          return false;
        })
        .map(([key]) => key);
    };

    // Encontrar enum keys por label matching
    const getTracingByLabel = (searchTerm: string): string[] => {
      const normalized = searchTerm.toLowerCase();
      return Object.entries(TRACING_OPTIONS)
        .filter(([_, opt]) => {
          // Búsqueda exacta en label
          if (exactMatch && opt.label.toLowerCase() === normalized) return true;
          // Búsqueda partial en label
          if (!exactMatch && opt.label.toLowerCase().includes(normalized))
            return true;
          return false;
        })
        .map(([key]) => key);
    };

    const orConditions: any[] = [];

    // Búsqueda en order y name (case-insensitive)
    terms.forEach((t) => {
      orConditions.push({
        order: exactMatch
          ? { equals: t, mode: "insensitive" }
          : { contains: t, mode: "insensitive" },
      });
      orConditions.push({
        name: exactMatch
          ? { equals: t, mode: "insensitive" }
          : { contains: t, mode: "insensitive" },
      });
    });

    // Búsqueda en tracing por enum key o label
    terms.forEach((t) => {
      const enumKeys = getTracingEnumKeys(t);
      const labelKeys = getTracingByLabel(t);
      const allTracingKeys = [...new Set([...enumKeys, ...labelKeys])];

      allTracingKeys.forEach((key) => {
        orConditions.push({
          tracing: { equals: key as any },
        });
      });
    });

    // Búsqueda en arrays (defendant, prosecutor, insurance)
    terms.forEach((t) => {
      orConditions.push({ defendant: { has: t } });
      orConditions.push({ prosecutor: { has: t } });
      orConditions.push({ insurance: { has: t } });
    });

    if (orConditions.length > 0) {
      where = { OR: orConditions };
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

  // Serializar fechas explícitamente para evitar problemas con RSC serialization
  const serializedRecords = records.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return { records: serializedRecords, lastId, hasMore };
}
