import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableField } from "@/app/(pages)/records/[id]/editable-field";

// Mock save-config para usar modo manual en todos los tests
vi.mock("@/lib/save-config", () => ({
  SAVE_CONFIG: { mode: "manual", debounceMs: 1000 },
  useDebounce: (cb: () => void) => cb,
}));

describe("EditableField", () => {
  const onSave = vi.fn();

  beforeEach(() => {
    onSave.mockClear();
  });

  it("muestra el valor en modo lectura", () => {
    render(<EditableField value="Texto inicial" onSave={onSave} />);
    expect(screen.getByText("Texto inicial")).toBeInTheDocument();
  });

  it("muestra placeholder cuando está vacío", () => {
    render(<EditableField value="" onSave={onSave} placeholder="Ingresa algo" />);
    expect(screen.getByText("Ingresa algo")).toBeInTheDocument();
  });

  it("cambia a modo edición al hacer click", async () => {
    render(<EditableField value="Click me" onSave={onSave} />);
    await userEvent.click(screen.getByText("Click me"));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Click me");
  });

  it("llama a onSave con el nuevo valor al presionar Enter", async () => {
    render(<EditableField value="Original" onSave={onSave} />);
    await userEvent.click(screen.getByText("Original"));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Nuevo valor");
    await userEvent.keyboard("{Enter}");
    expect(onSave).toHaveBeenCalledWith("Nuevo valor");
  });

  it("cancela con Escape y restaura el valor original", async () => {
    render(<EditableField value="Original" onSave={onSave} />);
    await userEvent.click(screen.getByText("Original"));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Cambio cancelado");
    await userEvent.keyboard("{Escape}");
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Original")).toBeInTheDocument();
  });

  it("no llama a onSave si el valor no cambió", async () => {
    render(<EditableField value="Mismo valor" onSave={onSave} />);
    await userEvent.click(screen.getByText("Mismo valor"));
    await userEvent.keyboard("{Enter}");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("muestra botones de guardar/cancelar en modo manual", async () => {
    render(<EditableField value="Texto" onSave={onSave} />);
    await userEvent.click(screen.getByText("Texto"));
    expect(screen.getByTitle("Guardar (Enter)")).toBeInTheDocument();
    expect(screen.getByTitle("Cancelar (Esc)")).toBeInTheDocument();
  });

  it("guarda al hacer click en el botón de guardar", async () => {
    render(<EditableField value="Antes" onSave={onSave} />);
    await userEvent.click(screen.getByText("Antes"));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Después");
    await userEvent.click(screen.getByTitle("Guardar (Enter)"));
    expect(onSave).toHaveBeenCalledWith("Después");
  });

  it("cancela al hacer click en el botón de cancelar", async () => {
    render(<EditableField value="Antes" onSave={onSave} />);
    await userEvent.click(screen.getByText("Antes"));
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Descartado");
    await userEvent.click(screen.getByTitle("Cancelar (Esc)"));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("Antes")).toBeInTheDocument();
  });
});
