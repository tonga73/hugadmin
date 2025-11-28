"use client";

import { useState, useCallback } from "react";
import { Plus, ChevronRight, X } from "lucide-react";
import { NoteCard, Note } from "./note-card";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-thin tracking-wide uppercase">Notas</h3>
        <div className="flex items-center gap-2">
          {hasMore && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Ver todas ({notes.length})
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Todas las notas ({notes.length})</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {notes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onSave={handleUpdateNote}
                        onDelete={handleDeleteNote}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="h-7 text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            Nueva
          </Button>
        </div>
      </div>

      {/* Lista de notas con scroll horizontal */}
      {(notes.length > 0 || isCreating) ? (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {/* Nota nueva en creación */}
            {isCreating && (
              <NoteCard
                note={newNote}
                isNew
                onSave={handleCreateNote}
                onCancel={handleCancelCreate}
              />
            )}

            {/* Notas visibles */}
            {visibleNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onSave={handleUpdateNote}
                onDelete={handleDeleteNote}
              />
            ))}

            {/* Indicador de más notas */}
            {hasMore && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="min-w-[80px] flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/30 transition-colors px-3 py-2">
                    <span className="text-lg font-bold text-muted-foreground">
                      +{notes.length - MAX_VISIBLE}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      más
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle>Todas las notas ({notes.length})</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {notes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onSave={handleUpdateNote}
                          onDelete={handleDeleteNote}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="text-white/50 py-3 text-center border-2 border-dashed rounded-lg">
          <p className="text-xs mb-1">No hay notas</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-6 text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            Crear nota
          </Button>
        </div>
      )}
    </div>
  );
}

