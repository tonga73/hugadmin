import { describe, it, expect, vi } from "vitest";

// Prevent Prisma from initializing (no DATABASE_URL in test env)
vi.mock("@/lib/prisma", () => ({ default: {} }));

import { getPrioritiesAboveMin, PRIORITY_ORDER } from "@/lib/user-config";

describe("getPrioritiesAboveMin", () => {
  it("returns all priorities from NULA onwards", () => {
    expect(getPrioritiesAboveMin("NULA")).toEqual([
      "NULA",
      "BAJA",
      "MEDIA",
      "ALTA",
      "URGENTE",
      "INACTIVO",
    ]);
  });

  it("returns priorities from MEDIA onwards", () => {
    expect(getPrioritiesAboveMin("MEDIA")).toEqual([
      "MEDIA",
      "ALTA",
      "URGENTE",
      "INACTIVO",
    ]);
  });

  it("returns only INACTIVO when given INACTIVO", () => {
    expect(getPrioritiesAboveMin("INACTIVO")).toEqual(["INACTIVO"]);
  });

  it("returns only URGENTE and INACTIVO when given URGENTE", () => {
    expect(getPrioritiesAboveMin("URGENTE")).toEqual(["URGENTE", "INACTIVO"]);
  });

  it("returns empty array for unknown priority", () => {
    expect(getPrioritiesAboveMin("DESCONOCIDA")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(getPrioritiesAboveMin("")).toEqual([]);
  });
});

describe("PRIORITY_ORDER", () => {
  it("has the correct order", () => {
    expect(PRIORITY_ORDER).toEqual([
      "NULA",
      "BAJA",
      "MEDIA",
      "ALTA",
      "URGENTE",
      "INACTIVO",
    ]);
  });

  it("has NULA at index 0", () => {
    expect(PRIORITY_ORDER.indexOf("NULA")).toBe(0);
  });

  it("has URGENTE before INACTIVO", () => {
    expect(PRIORITY_ORDER.indexOf("URGENTE")).toBeLessThan(
      PRIORITY_ORDER.indexOf("INACTIVO")
    );
  });
});
