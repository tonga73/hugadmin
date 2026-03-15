/**
 * Tests del schema Zod usado en RecordForm (validación client-side).
 */
import { describe, it, expect } from "vitest";
import { recordSchema } from "@/components/records/record-form";

describe("recordSchema (client-side)", () => {
  const validData = {
    name: "García c/ López s/ Daños y Perjuicios",
    order: "12345/2024",
    tracing: "ACEPTA_CARGO",
    defendant: [],
    prosecutor: [],
    insurance: [],
  };

  it("acepta datos válidos mínimos", () => {
    expect(recordSchema.safeParse(validData).success).toBe(true);
  });

  it("rechaza name con menos de 3 caracteres", () => {
    const result = recordSchema.safeParse({ ...validData, name: "AB" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("3");
    }
  });

  it("rechaza order vacío", () => {
    const result = recordSchema.safeParse({ ...validData, order: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza tracing no definido en las opciones", () => {
    const result = recordSchema.safeParse({ ...validData, tracing: "NO_EXISTE" });
    expect(result.success).toBe(false);
  });

  it("acepta arrays de partes con valores", () => {
    const result = recordSchema.safeParse({
      ...validData,
      defendant: [{ value: "Pérez, Juan" }],
      prosecutor: [{ value: "López, María" }],
      insurance: [{ value: "Seguros SA" }],
    });
    expect(result.success).toBe(true);
  });

  it("acepta code como opcional", () => {
    const result = recordSchema.safeParse({ ...validData, code: "A-123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("A-123");
  });

  it("acepta officeId null", () => {
    const result = recordSchema.safeParse({ ...validData, officeId: null });
    expect(result.success).toBe(true);
  });

  it("acepta officeId numérico", () => {
    const result = recordSchema.safeParse({ ...validData, officeId: 5 });
    expect(result.success).toBe(true);
  });

  it("los arrays default a vacío si se omiten", () => {
    const result = recordSchema.safeParse({
      name: validData.name,
      order: validData.order,
      tracing: validData.tracing,
    });
    if (result.success) {
      expect(result.data.defendant).toEqual([]);
      expect(result.data.prosecutor).toEqual([]);
      expect(result.data.insurance).toEqual([]);
    }
  });
});
