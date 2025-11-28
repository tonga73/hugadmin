"use client";

import { useState, useCallback } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { NoteCard, Note } from "./note-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface NotesSectionProps {
  recordId: number;
  initialNotes: Note[];
}

export function NotesSection({ recordId, initialNotes }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const MAX_VISIBLE = 3;
  const hasMore = notes.length > MAX_VISIBLE;
  const visibleNotes = notes.slice(0, MAX_VISIBLE);

  // Crear nota
  const handleCreateNote = useCallback(
    async (note: Note) => {
      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recordId,
            name: note.name,
            text: note.text,
          }),
        });

        if (!response.ok) {
          throw new Error("Error al crear nota");
        }

        const newNote = await response.json();
        setNotes((prev) => [newNote, ...prev]);
        setIsCreating(false);
        toast.success("Nota creada");
      } catch (error) {
        console.error("Error creating note:", error);
        toast.error("No se pudo crear la nota");
        throw error;
      }
    },
    [recordId]
  );

  // Actualizar nota
  const handleUpdateNote = useCallback(async (note: Note) => {
    if (!note.id) return;

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: note.name,
          text: note.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar nota");
      }

      const updatedNote = await response.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
      );
      toast.success("Nota actualizada");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("No se pudo actualizar la nota");
      throw error;
    }
  }, []);

  // Eliminar nota
  const handleDeleteNote = useCallback(async (noteId: number) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar nota");
      }

      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Nota eliminada");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("No se pudo eliminar la nota");
      throw error;
    }
  }, []);

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  // Nueva nota vacía para crear
  const newNote: Note = {
    name: null,
    text: "",
    recordId,
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-thin tracking-wide uppercase text-muted-foreground">
          Notas
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="h-5 text-[10px] gap-0.5 px-1.5"
          >
            <Plus className="h-2.5 w-2.5" />
            Nueva
          </Button>
          {hasMore && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 text-[10px] gap-0.5 px-1.5">
                  Ver todas ({notes.length})
                  <ChevronRight className="h-2.5 w-2.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="shrink-0">
                  <DialogTitle>Todas las notas ({notes.length})</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  <div className="grid grid-cols-2 gap-3 pb-4">
                    {notes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onSave={handleUpdateNote}
                        onDelete={handleDeleteNote}
                        fullWidth
                      />
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Grid de notas - siempre 3 columnas */}
      {(notes.length > 0 || isCreating) ? (
        <div className="grid grid-cols-3 gap-2">
          {/* Nota nueva en creación */}
          {isCreating && (
            <NoteCard
              note={newNote}
              isNew
              onSave={handleCreateNote}
              onCancel={handleCancelCreate}
              fullWidth
            />
          )}

          {/* Notas visibles (máximo 3, o 2 si hay una en creación) */}
          {(isCreating ? visibleNotes.slice(0, 2) : visibleNotes).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSave={handleUpdateNote}
              onDelete={handleDeleteNote}
              fullWidth
            />
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground py-3 text-center border-2 border-dashed rounded-lg">
          <p className="text-[10px] mb-1">No hay notas</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-5 text-[10px] gap-0.5"
          >
            <Plus className="h-2.5 w-2.5" />
            Crear nota
          </Button>
        </div>
      )}
    </div>
  );
}
