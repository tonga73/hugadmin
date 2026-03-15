import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableList } from "@/app/(pages)/records/[id]/editable-list";

vi.mock("@/lib/save-config", () => ({
  SAVE_CONFIG: { mode: "manual", debounceMs: 1000 },
}));

describe("EditableList", () => {
  const onSave = vi.fn();

  beforeEach(() => {
    onSave.mockClear();
  });

  it("muestra la lista de items en modo lectura", () => {
    render(<EditableList items={["Juan", "María"]} onSave={onSave} />);
    expect(screen.getByText("Juan")).toBeInTheDocument();
    expect(screen.getByText("María")).toBeInTheDocument();
  });

  it("muestra mensaje de vacío cuando no hay items", () => {
    render(<EditableList items={[]} onSave={onSave} />);
    expect(screen.getByText(/click para agregar/i)).toBeInTheDocument();
  });

  it("cambia a modo edición al hacer click", async () => {
    render(<EditableList items={["Item 1"]} onSave={onSave} />);
    await userEvent.click(screen.getByTitle("Click para editar"));
    expect(screen.getByPlaceholderText("Agregar...")).toBeInTheDocument();
  });

  it("agrega un item nuevo al presionar Enter", async () => {
    render(<EditableList items={["Existente"]} onSave={onSave} />);
    await userEvent.click(screen.getByTitle("Click para editar"));
    const input = screen.getByPlaceholderText("Agregar...");
    await userEvent.type(input, "Nuevo{Enter}");
    expect(onSave).toHaveBeenCalledWith(["Existente", "Nuevo"]);
  });

  it("agrega un item nuevo desde lista vacía", async () => {
    render(<EditableList items={[]} onSave={onSave} />);
    await userEvent.click(screen.getByTitle("Click para editar"));
    const input = screen.getByPlaceholderText("Agregar...");
    await userEvent.type(input, "Primer item{Enter}");
    expect(onSave).toHaveBeenCalledWith(["Primer item"]);
  });

  it("cierra el modo edición con Escape", async () => {
    render(<EditableList items={["Juan"]} onSave={onSave} />);
    await userEvent.click(screen.getByTitle("Click para editar"));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText("Agregar...")).not.toBeInTheDocument();
  });

  it("elimina un item al hacer click en X (hover)", async () => {
    render(<EditableList items={["Juan", "María"]} onSave={onSave} />);
    await userEvent.click(screen.getByTitle("Click para editar"));
    // El botón de eliminar aparece en hover, pero en el test está presente en el DOM
    const deleteButtons = screen.getAllByTitle("Eliminar");
    await userEvent.click(deleteButtons[0]);
    expect(onSave).toHaveBeenCalledWith(["María"]);
  });
});
