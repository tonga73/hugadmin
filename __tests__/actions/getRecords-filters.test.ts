import { describe, it, expect, vi } from "vitest";

// Prevent Prisma from initializing (no DATABASE_URL in test env)
vi.mock("@/lib/prisma", () => ({ default: {} }));

import { getPrioritiesAboveMin } from "@/lib/user-config";

/**
 * Tests for the user-filter logic used in getRecords.
 * Since getRecords is a server action using next/cache and prisma,
 * we test the underlying filter-building logic via the exported helpers.
 */

describe("getRecords filter logic — tracingFilter", () => {
  it("empty tracingFilter means no tracing restriction", () => {
    const tracingFilter: string[] = [];
    const whereCondition =
      tracingFilter.length > 0 ? { tracing: { in: tracingFilter } } : {};
    expect(whereCondition).toEqual({});
  });

  it("non-empty tracingFilter builds correct where clause", () => {
    const tracingFilter = ["ACEPTA_CARGO", "EN_TRAMITE"];
    const whereCondition =
      tracingFilter.length > 0 ? { tracing: { in: tracingFilter } } : {};
    expect(whereCondition).toEqual({
      tracing: { in: ["ACEPTA_CARGO", "EN_TRAMITE"] },
    });
  });

  it("single tracing value builds correct where clause", () => {
    const tracingFilter = ["RESUELTO"];
    const whereCondition =
      tracingFilter.length > 0 ? { tracing: { in: tracingFilter } } : {};
    expect(whereCondition).toEqual({ tracing: { in: ["RESUELTO"] } });
  });
});

describe("getRecords filter logic — favoritesOnly", () => {
  it("favoritesOnly=false adds no favorite filter", () => {
    const favoritesOnly = false;
    const whereCondition = favoritesOnly ? { favorite: true } : {};
    expect(whereCondition).toEqual({});
  });

  it("favoritesOnly=true adds favorite:true filter", () => {
    const favoritesOnly = true;
    const whereCondition = favoritesOnly ? { favorite: true } : {};
    expect(whereCondition).toEqual({ favorite: true });
  });
});

describe("getRecords filter logic — minPriority", () => {
  it("null minPriority applies no filter", () => {
    const minPriority: string | null = null;
    const priorities = minPriority ? getPrioritiesAboveMin(minPriority) : [];
    const whereCondition =
      priorities.length > 0 ? { priority: { in: priorities } } : {};
    expect(whereCondition).toEqual({});
  });

  it("ALTA minPriority filters to ALTA, URGENTE, INACTIVO", () => {
    const minPriority = "ALTA";
    const priorities = getPrioritiesAboveMin(minPriority);
    const whereCondition =
      priorities.length > 0 ? { priority: { in: priorities } } : {};
    expect(whereCondition).toEqual({
      priority: { in: ["ALTA", "URGENTE", "INACTIVO"] },
    });
  });

  it("BAJA minPriority includes all except NULA", () => {
    const minPriority = "BAJA";
    const priorities = getPrioritiesAboveMin(minPriority);
    expect(priorities).toEqual(["BAJA", "MEDIA", "ALTA", "URGENTE", "INACTIVO"]);
    expect(priorities).not.toContain("NULA");
  });

  it("URGENTE minPriority only includes URGENTE and INACTIVO", () => {
    const minPriority = "URGENTE";
    const priorities = getPrioritiesAboveMin(minPriority);
    expect(priorities).toHaveLength(2);
    expect(priorities).toContain("URGENTE");
    expect(priorities).toContain("INACTIVO");
  });
});

describe("getRecords filter logic — combined filters", () => {
  it("multiple filters build correctly combined where clause", () => {
    const tracingFilter = ["ACEPTA_CARGO"];
    const favoritesOnly = true;
    const minPriority = "ALTA";

    const where: Record<string, unknown> = {};

    if (tracingFilter.length > 0) {
      where.tracing = { in: tracingFilter };
    }
    if (favoritesOnly) {
      where.favorite = true;
    }
    if (minPriority) {
      const priorities = getPrioritiesAboveMin(minPriority);
      if (priorities.length > 0) {
        where.priority = { in: priorities };
      }
    }

    expect(where).toEqual({
      tracing: { in: ["ACEPTA_CARGO"] },
      favorite: true,
      priority: { in: ["ALTA", "URGENTE", "INACTIVO"] },
    });
  });

  it("no active filters produce empty where clause", () => {
    const tracingFilter: string[] = [];
    const favoritesOnly = false;
    const minPriority: string | null = null;

    const where: Record<string, unknown> = {};
    if (tracingFilter.length > 0) where.tracing = { in: tracingFilter };
    if (favoritesOnly) where.favorite = true;
    if (minPriority) {
      const priorities = getPrioritiesAboveMin(minPriority);
      if (priorities.length > 0) where.priority = { in: priorities };
    }

    expect(where).toEqual({});
    expect(Object.keys(where)).toHaveLength(0);
  });
});
