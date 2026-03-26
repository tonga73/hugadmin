import { describe, it, expect } from "vitest";
import { normalizeOrder, formatOrder } from "@/lib/record-number";

describe("normalizeOrder", () => {
  it("strips dots from formatted order", () => {
    expect(normalizeOrder("12.345/2020")).toBe("12345/2020");
  });

  it("is idempotent when no dots present", () => {
    expect(normalizeOrder("890/2020")).toBe("890/2020");
    expect(normalizeOrder("12345/2020")).toBe("12345/2020");
  });

  it("trims whitespace", () => {
    expect(normalizeOrder("  12.345/2020  ")).toBe("12345/2020");
  });
});

describe("formatOrder", () => {
  it("adds thousands separator to 5-digit number", () => {
    expect(formatOrder("12345/2020")).toBe("12.345/2020");
  });

  it("does not add separator to 3-digit number", () => {
    expect(formatOrder("890/2020")).toBe("890/2020");
  });

  it("adds multiple separators for large numbers", () => {
    expect(formatOrder("1234567/2020")).toBe("1.234.567/2020");
  });

  it("handles 4-digit number without separator", () => {
    expect(formatOrder("1234/2020")).toBe("1.234/2020");
  });
});

describe("round-trip", () => {
  it("normalize then format returns formatted value", () => {
    expect(formatOrder(normalizeOrder("12.345/2020"))).toBe("12.345/2020");
  });

  it("format then normalize returns normalized value", () => {
    expect(normalizeOrder(formatOrder("12345/2020"))).toBe("12345/2020");
  });
});
