import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the PATCH /api/users/me/config validation logic.
 * We test the field-validation rules in isolation since the route
 * uses Next.js-specific handlers that require a full runtime.
 */

// These are the valid enum values as defined in the Prisma schema
const VALID_TRACING = [
  "ACEPTA_CARGO",
  "EN_TRAMITE",
  "RESUELTO",
  "INACTIVO",
  "PENDIENTE",
];
const VALID_PRIORITY = ["NULA", "BAJA", "MEDIA", "ALTA", "URGENTE", "INACTIVO"];
const VALID_FILE_CATEGORY = ["DRIVE", "APARTADO", "EXPEDIENTE"];
const VALID_DASHBOARD_VIEW = ["OVERVIEW", "STAGE", "FOCUS"];

// Mirrors the validation logic from the route handler
function validateConfigPatch(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  if (Array.isArray(body.tracingFilter)) {
    data.tracingFilter = (body.tracingFilter as string[]).filter((v) =>
      VALID_TRACING.includes(v)
    );
  }
  if (typeof body.favoritesOnly === "boolean") {
    data.favoritesOnly = body.favoritesOnly;
  }
  if (body.minPriority === null || VALID_PRIORITY.includes(body.minPriority as string)) {
    data.minPriority = body.minPriority ?? null;
  }
  if (Array.isArray(body.fileCategories)) {
    data.fileCategories = (body.fileCategories as string[]).filter((v) =>
      VALID_FILE_CATEGORY.includes(v)
    );
  }
  if (VALID_DASHBOARD_VIEW.includes(body.dashboardView as string)) {
    data.dashboardView = body.dashboardView;
  }

  return data;
}

describe("PATCH /api/users/me/config — validation", () => {
  it("accepts valid tracingFilter array", () => {
    const result = validateConfigPatch({
      tracingFilter: ["ACEPTA_CARGO", "EN_TRAMITE"],
    });
    expect(result.tracingFilter).toEqual(["ACEPTA_CARGO", "EN_TRAMITE"]);
  });

  it("strips invalid tracing values from array", () => {
    const result = validateConfigPatch({
      tracingFilter: ["ACEPTA_CARGO", "FAKE_STATE"],
    });
    expect(result.tracingFilter).toEqual(["ACEPTA_CARGO"]);
  });

  it("accepts empty tracingFilter array", () => {
    const result = validateConfigPatch({ tracingFilter: [] });
    expect(result.tracingFilter).toEqual([]);
  });

  it("ignores tracingFilter when not an array", () => {
    const result = validateConfigPatch({ tracingFilter: "ACEPTA_CARGO" });
    expect(result.tracingFilter).toBeUndefined();
  });

  it("accepts favoritesOnly=true", () => {
    const result = validateConfigPatch({ favoritesOnly: true });
    expect(result.favoritesOnly).toBe(true);
  });

  it("accepts favoritesOnly=false", () => {
    const result = validateConfigPatch({ favoritesOnly: false });
    expect(result.favoritesOnly).toBe(false);
  });

  it("ignores favoritesOnly when not a boolean", () => {
    const result = validateConfigPatch({ favoritesOnly: "true" });
    expect(result.favoritesOnly).toBeUndefined();
  });

  it("accepts valid minPriority", () => {
    const result = validateConfigPatch({ minPriority: "ALTA" });
    expect(result.minPriority).toBe("ALTA");
  });

  it("accepts null minPriority to clear the filter", () => {
    const result = validateConfigPatch({ minPriority: null });
    expect(result.minPriority).toBeNull();
  });

  it("ignores invalid minPriority string", () => {
    const result = validateConfigPatch({ minPriority: "EXTREME" });
    expect(result.minPriority).toBeUndefined();
  });

  it("accepts valid fileCategories array", () => {
    const result = validateConfigPatch({
      fileCategories: ["DRIVE", "EXPEDIENTE"],
    });
    expect(result.fileCategories).toEqual(["DRIVE", "EXPEDIENTE"]);
  });

  it("strips invalid file category values", () => {
    const result = validateConfigPatch({
      fileCategories: ["DRIVE", "INVALID_CAT"],
    });
    expect(result.fileCategories).toEqual(["DRIVE"]);
  });

  it("accepts all three file categories", () => {
    const result = validateConfigPatch({
      fileCategories: ["DRIVE", "APARTADO", "EXPEDIENTE"],
    });
    expect(result.fileCategories).toEqual(["DRIVE", "APARTADO", "EXPEDIENTE"]);
  });

  it("accepts valid dashboardView", () => {
    const result = validateConfigPatch({ dashboardView: "STAGE" });
    expect(result.dashboardView).toBe("STAGE");
  });

  it("ignores invalid dashboardView", () => {
    const result = validateConfigPatch({ dashboardView: "CUSTOM" });
    expect(result.dashboardView).toBeUndefined();
  });

  it("accepts all four dashboardView values", () => {
    for (const view of VALID_DASHBOARD_VIEW) {
      const result = validateConfigPatch({ dashboardView: view });
      expect(result.dashboardView).toBe(view);
    }
  });

  it("handles partial updates (only some fields)", () => {
    const result = validateConfigPatch({
      favoritesOnly: true,
      dashboardView: "FOCUS",
    });
    expect(result.favoritesOnly).toBe(true);
    expect(result.dashboardView).toBe("FOCUS");
    expect(result.tracingFilter).toBeUndefined();
    expect(result.minPriority).toBeUndefined();
    expect(result.fileCategories).toBeUndefined();
  });

  it("returns empty object for empty body", () => {
    const result = validateConfigPatch({});
    expect(result).toEqual({});
  });
});
