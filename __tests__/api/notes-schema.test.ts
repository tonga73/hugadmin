/**
 * Tests para la lógica de validación de notas en la API.
 */
import { describe, it, expect } from "vitest";

// Replicamos la validación de la ruta POST /api/notes
function validateNoteCreate(body: unknown): { valid: boolean; error?: string } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Body inválido" };
  }
  const { recordId, text } = body as Record<string, unknown>;
  if (!recordId || !text) {
    return { valid: false, error: "recordId y text son requeridos" };
  }
  if (typeof text !== "string" || (text as string).trim() === "") {
    return { valid: false, error: "text no puede estar vacío" };
  }
  return { valid: true };
}

describe("validación de creación de nota", () => {
  it("acepta recordId y text válidos", () => {
    expect(validateNoteCreate({ recordId: 1, text: "Nota de prueba" }).valid).toBe(true);
  });

  it("rechaza sin recordId", () => {
    const result = validateNoteCreate({ text: "Texto válido" });
    expect(result.valid).toBe(false);
  });

  it("rechaza sin text", () => {
    const result = validateNoteCreate({ recordId: 1 });
    expect(result.valid).toBe(false);
  });

  it("rechaza body null", () => {
    expect(validateNoteCreate(null).valid).toBe(false);
  });

  it("acepta name opcional", () => {
    expect(validateNoteCreate({ recordId: 1, text: "Hola", name: "Título" }).valid).toBe(true);
  });
});
