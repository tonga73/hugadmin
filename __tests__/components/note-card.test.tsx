import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoteCard, NoteEditDialog, type Note } from "@/app/(pages)/records/[id]/note-card";

const baseNote: Note = {
  id: 1,
  name: "Título de nota",
  text: "Contenido de la nota",
  recordId: 42,
};

describe("NoteCard (vista)", () => {
  it("muestra el nombre y texto de la nota", () => {
    render(<NoteCard note={baseNote} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Título de nota")).toBeInTheDocument();
    expect(screen.getByText("Contenido de la nota")).toBeInTheDocument();
  });

  it("muestra 'Sin título' cuando name es null", () => {
    render(<NoteCard note={{ ...baseNote, name: null }} onSave={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Sin título")).toBeInTheDocument();
  });

  it("no abre el formulario de edición al hacer click en el cuerpo", async () => {
    render(<NoteCard note={baseNote} onSave={vi.fn()} onDelete={vi.fn()} />);
    await userEvent.click(screen.getByText("Contenido de la nota"));
    expect(screen.queryByPlaceholderText("Contenido...")).not.toBeInTheDocument();
  });
});

describe("NoteEditDialog (nueva nota)", () => {
  const newNote: Note = { name: null, text: "", recordId: 42 };

  it("muestra el formulario cuando open=true", () => {
    render(
      <NoteEditDialog
        note={newNote}
        isNew
        open
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText("Contenido...")).toBeInTheDocument();
  });

  it("deshabilita el botón guardar si text está vacío", () => {
    render(
      <NoteEditDialog
        note={newNote}
        isNew
        open
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const saveBtn = screen.getByRole("button", { name: /guardar/i });
    expect(saveBtn).toBeDisabled();
  });

  it("llama a onSave con el texto ingresado", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <NoteEditDialog
        note={newNote}
        isNew
        open
        onOpenChange={vi.fn()}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    );
    const textarea = screen.getByPlaceholderText("Contenido...");
    await userEvent.type(textarea, "Nueva nota{Control>}{Enter}");
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Nueva nota" })
    );
  });

  it("llama a onCancel al cancelar", async () => {
    const onOpenChange = vi.fn();
    render(
      <NoteEditDialog
        note={newNote}
        isNew
        open
        onOpenChange={onOpenChange}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const cancelBtn = screen.getAllByRole("button").find((b) =>
      b.querySelector("svg") !== null && !b.textContent?.includes("Guardar")
    );
    if (cancelBtn) await userEvent.click(cancelBtn);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("NoteEditDialog (Escape)", () => {
  it("cierra el diálogo con Escape", async () => {
    const onOpenChange = vi.fn();
    render(
      <NoteEditDialog
        note={baseNote}
        open
        onOpenChange={onOpenChange}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
