/**
 * Tests para los schemas Zod de las rutas de API de records.
 * No requieren mocking de base de datos: validan solo la lógica de parsing.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { Priority, Tracing } from "@/app/generated/prisma/enums";

// ── Schemas extraídos de las rutas (duplicados aquí para aislar la lógica) ──
const createRecordSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  order: z.string().min(1, "El orden es requerido"),
  tracing: z.nativeEnum(Tracing),
  priority: z.nativeEnum(Priority).optional().default(Priority.NULA),
  code: z.string().optional(),
  insurance: z.array(z.string()).optional(),
  defendant: z.array(z.string()).optional(),
  prosecutor: z.array(z.string()).optional(),
  officeId: z.number().nullable().optional(),
});

const updateRecordSchema = z.object({
  code: z.string().optional(),
  order: z.string().min(1, "El orden es requerido").optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
  insurance: z.array(z.string()).optional(),
  defendant: z.array(z.string()).optional(),
  prosecutor: z.array(z.string()).optional(),
  tracing: z.nativeEnum(Tracing).optional(),
  priority: z.nativeEnum(Priority).optional(),
  favorite: z.boolean().optional(),
  archive: z.boolean().optional(),
  officeId: z.number().nullable().optional(),
});

// ──────────────────────────────────────────────────────────────────────────────

describe("createRecordSchema", () => {
  const validPayload = {
    name: "García c/ López s/ Daños",
    order: "12345/2024",
    tracing: Tracing.ACEPTA_CARGO,
  };

  it("acepta un payload mínimo válido", () => {
    const result = createRecordSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("aplica priority NULA por defecto", () => {
    const result = createRecordSchema.safeParse(validPayload);
    expect(result.success && result.data.priority).toBe(Priority.NULA);
  });

  it("rechaza name con menos de 3 caracteres", () => {
    const result = createRecordSchema.safeParse({ ...validPayload, name: "AB" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("rechaza order vacío", () => {
    const result = createRecordSchema.safeParse({ ...validPayload, order: "" });
    expect(result.success).toBe(false);
  });

  it("rechaza tracing inválido", () => {
    const result = createRecordSchema.safeParse({ ...validPayload, tracing: "INEXISTENTE" });
    expect(result.success).toBe(false);
  });

  it("acepta todos los valores de Tracing", () => {
    for (const tracing of Object.values(Tracing)) {
      const result = createRecordSchema.safeParse({ ...validPayload, tracing });
      expect(result.success).toBe(true);
    }
  });

  it("acepta arrays de partes", () => {
    const result = createRecordSchema.safeParse({
      ...validPayload,
      defendant: ["Pérez, Juan"],
      prosecutor: ["López, María"],
      insurance: ["La Caja S.A."],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.defendant).toEqual(["Pérez, Juan"]);
    }
  });

  it("acepta officeId null", () => {
    const result = createRecordSchema.safeParse({ ...validPayload, officeId: null });
    expect(result.success).toBe(true);
  });

  it("acepta officeId numérico", () => {
    const result = createRecordSchema.safeParse({ ...validPayload, officeId: 42 });
    expect(result.success).toBe(true);
  });
});

describe("updateRecordSchema", () => {
  it("acepta payload vacío (todos opcionales)", () => {
    const result = updateRecordSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("acepta actualización parcial de name", () => {
    const result = updateRecordSchema.safeParse({ name: "Nuevo nombre válido" });
    expect(result.success).toBe(true);
  });

  it("rechaza name con menos de 3 caracteres en update", () => {
    const result = updateRecordSchema.safeParse({ name: "AB" });
    expect(result.success).toBe(false);
  });

  it("acepta favorite como boolean", () => {
    expect(updateRecordSchema.safeParse({ favorite: true }).success).toBe(true);
    expect(updateRecordSchema.safeParse({ favorite: false }).success).toBe(true);
  });

  it("acepta archive como boolean", () => {
    expect(updateRecordSchema.safeParse({ archive: true }).success).toBe(true);
  });

  it("acepta officeId null para desconectar office", () => {
    const result = updateRecordSchema.safeParse({ officeId: null });
    expect(result.success).toBe(true);
  });

  it("rechaza tracing inválido en update", () => {
    const result = updateRecordSchema.safeParse({ tracing: "INVALIDO" });
    expect(result.success).toBe(false);
  });

  it("acepta todos los valores de Priority", () => {
    for (const priority of Object.values(Priority)) {
      const result = updateRecordSchema.safeParse({ priority });
      expect(result.success).toBe(true);
    }
  });
});
