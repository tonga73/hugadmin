import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("combina clases simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignora falsy values", () => {
    expect(cn("foo", undefined, null, false, "bar")).toBe("foo bar");
  });

  it("resuelve conflictos de Tailwind (última clase gana)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("combina condicionales", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });

  it("retorna string vacío sin argumentos", () => {
    expect(cn()).toBe("");
  });
});
