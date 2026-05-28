import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TracingBadge } from "@/components/records/tracing-badge";
import { TRACING_OPTIONS } from "@/app/constants";

describe("TracingBadge", () => {
  it("muestra el label del tracing correcto", () => {
    render(<TracingBadge tracing="ACEPTA_CARGO" />);
    expect(screen.getByText(TRACING_OPTIONS.ACEPTA_CARGO.label)).toBeInTheDocument();
  });

  it("aplica el color de fondo correcto via style", () => {
    const { container } = render(<TracingBadge tracing="COBRADO" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ backgroundColor: TRACING_OPTIONS.COBRADO.color });
  });

  it("aplica el color de texto fijo via style", () => {
    const { container } = render(<TracingBadge tracing="HONORARIOS_REGULADOS" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveStyle({ color: "var(--tracing-text)" });
  });

  it("renderiza para cada valor de tracing", () => {
    for (const [key, option] of Object.entries(TRACING_OPTIONS)) {
      const { unmount } = render(<TracingBadge tracing={key} />);
      expect(screen.getByText(option.label)).toBeInTheDocument();
      unmount();
    }
  });
});
