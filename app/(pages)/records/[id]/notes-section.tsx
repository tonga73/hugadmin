"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
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
  const sorted = [...notes].sort((a, b) => {
    const dateA = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
    const dateB = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
    return dateB - dateA;
  });
  const visibleNotes = sorted.slice(0, MAX_VISIBLE);
  const hiddenCount = Math.max(0, notes.length - MAX_VISIBLE);

  const handleCreateNote = useCallback(
    async (note: Note) => {
      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId, name: note.name, text: note.text }),
        });
        if (!response.ok) throw new Error("Error al crear nota");
        const newNote = await response.json();
        setNotes((prev) => [newNote, ...prev]);
        setIsCreating(false);
        toast.success("Nota creada");
      } catch {
        toast.error("No se pudo crear la nota");
        throw new Error("Error al crear nota");
      }
    },
    [recordId]
  );

  const handleUpdateNote = useCallback(async (note: Note) => {
    if (!note.id) return;
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: note.name, text: note.text }),
      });
      if (!response.ok) throw new Error("Error al actualizar nota");
      const updatedNote = await response.json();
      setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      toast.success("Nota actualizada");
    } catch {
      toast.error("No se pudo actualizar la nota");
      throw new Error("Error al actualizar nota");
    }
  }, []);

  const handleDeleteNote = useCallback(async (noteId: number) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error al eliminar nota");
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Nota eliminada");
    } catch {
      toast.error("No se pudo eliminar la nota");
      throw new Error("Error al eliminar nota");
    }
  }, []);

  const newNote: Note = { name: null, text: "", recordId };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Header fijo */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
          Notas
        </p>
        <div className="flex items-center gap-1">
          {hiddenCount > 0 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1.5 text-muted-foreground/60">
                  +{hiddenCount} más
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[min(32rem,95vw)] max-h-[85dvh] overflow-hidden flex flex-col">
                <DialogHeader className="shrink-0">
                  <DialogTitle>Todas las notas ({notes.length})</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-2">
                  <div className="flex flex-col gap-2 pb-4">
                    {sorted.map((note) => (
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
        </div>
      </div>

      {/* Lista scrollable */}
      <div className="flex-1 overflow-y-auto px-3 pt-1.5 pb-2 space-y-1.5">
        {isCreating && (
          <NoteCard
            note={newNote}
            isNew
            onSave={handleCreateNote}
            onCancel={() => setIsCreating(false)}
            fullWidth
          />
        )}

        {notes.length === 0 && !isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full text-center py-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-[10px] text-muted-foreground/50 hover:border-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            <Plus className="h-3 w-3 mx-auto mb-1" />
            Agregar primera nota
          </button>
        ) : (
          (isCreating ? visibleNotes.slice(0, MAX_VISIBLE - 1) : visibleNotes).map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSave={handleUpdateNote}
              onDelete={handleDeleteNote}
              fullWidth
            />
          ))
        )}
      </div>
    </div>
  );
}
