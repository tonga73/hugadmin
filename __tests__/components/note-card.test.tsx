import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoteCard, type Note } from "@/app/(pages)/records/[id]/note-card";

const baseNote: Note = {
  id: 1,
  name: "Título de nota",
  text: "Contenido de la nota",
  recordId: 42,
};

describe("NoteCard (modo lectura)", () => {
  it("muestra el nombre y texto de la nota", () => {
    render(<NoteCard note={baseNote} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Título de nota")).toBeInTheDocument();
    expect(screen.getByText("Contenido de la nota")).toBeInTheDocument();
  });

  it("muestra 'Sin título' cuando name es null", () => {
    render(<NoteCard note={{ ...baseNote, name: null }} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Sin título")).toBeInTheDocument();
  });

  it("cambia a modo edición al hacer click", async () => {
    render(<NoteCard note={baseNote} onSave={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByText("Contenido de la nota"));
    expect(screen.getByPlaceholderText("Contenido...")).toBeInTheDocument();
  });
});

describe("NoteCard (modo edición nueva nota)", () => {
  const newNote: Note = { name: null, text: "", recordId: 42 };

  it("empieza en modo edición cuando isNew=true", () => {
    render(<NoteCard note={newNote} isNew onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText("Contenido...")).toBeInTheDocument();
  });

  it("deshabilita el botón guardar si text está vacío", () => {
    render(<NoteCard note={newNote} isNew onSave={vi.fn()} onCancel={vi.fn()} />);
    // Buscar el botón de guardar (Check icon) — está disabled cuando text está vacío
    const buttons = screen.getAllByRole("button");
    const saveButton = buttons.find((b) => !b.querySelector("svg[data-icon]") && b !== buttons[0]);
    // El botón submit tiene type="button" y está deshabilitado
    const submitBtn = buttons[buttons.length - 1];
    expect(submitBtn).toBeDisabled();
  });

  it("llama a onCancel al cancelar nota nueva", async () => {
    const onCancel = vi.fn();
    render(<NoteCard note={newNote} isNew onSave={vi.fn()} onCancel={onCancel} />);
    const cancelBtn = screen.getAllByRole("button")[0];
    await userEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it("llama a onSave con el texto ingresado", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<NoteCard note={newNote} isNew onSave={onSave} onCancel={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Contenido...");
    await userEvent.type(textarea, "Nueva nota{Control>}{Enter}");
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Nueva nota" })
    );
  });
});

describe("NoteCard (cancelar con Escape)", () => {
  it("cancela edición de nota existente con Escape", async () => {
    render(<NoteCard note={baseNote} onSave={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByText("Contenido de la nota"));
    await userEvent.keyboard("{Escape}");
    expect(screen.getByText("Contenido de la nota")).toBeInTheDocument();
  });
});
