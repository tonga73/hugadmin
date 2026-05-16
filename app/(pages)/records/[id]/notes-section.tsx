"use client";

import { useState, useCallback } from "react";
import { Plus, BookOpen } from "lucide-react";
import { NoteCard, NoteEditDialog, Note } from "./note-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface NotesSectionProps {
  recordId: number;
  initialNotes: Note[];
}

export function NotesSection({ recordId, initialNotes }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [createOpen, setCreateOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);

  const MAX_VISIBLE = 3;

  const sorted = [...notes].sort((a, b) =>
    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
  const visibleNotes = sorted.slice(0, MAX_VISIBLE);

  const handleCreateNote = useCallback(
    async (note: Note) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, name: note.name, text: note.text }),
      });
      if (!response.ok) { toast.error("No se pudo crear la nota"); throw new Error(); }
      const newNote = await response.json();
      setNotes((prev) => [newNote, ...prev]);
      toast.success("Nota creada");
    },
    [recordId]
  );

  const handleUpdateNote = useCallback(async (note: Note) => {
    if (!note.id) return;
    const response = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: note.name, text: note.text }),
    });
    if (!response.ok) { toast.error("No se pudo actualizar la nota"); throw new Error(); }
    const updated = await response.json();
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    toast.success("Nota actualizada");
  }, []);

  const handleDeleteNote = useCallback(async (noteId: number) => {
    const response = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    if (!response.ok) { toast.error("No se pudo eliminar la nota"); throw new Error(); }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success("Nota eliminada");
  }, []);

  const newNote: Note = { name: null, text: "", recordId };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
          Notas {notes.length > 0 && <span className="font-normal">({notes.length})</span>}
        </p>
        <div className="flex items-center gap-1">
          {notes.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAllOpen(true)}
              className="h-5 text-[10px] px-1.5 text-muted-foreground/60 gap-1"
            >
              <BookOpen className="h-2.5 w-2.5" />
              Ver todas
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-5 text-[10px] gap-0.5 px-1.5"
          >
            <Plus className="h-2.5 w-2.5" />
            Nueva
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-3 pt-1.5 pb-2 space-y-1.5">
        {notes.length === 0 ? (
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full text-center py-4 border-2 border-dashed border-muted-foreground/20 rounded-lg text-[10px] text-muted-foreground/50 hover:border-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            <Plus className="h-3 w-3 mx-auto mb-1" />
            Agregar primera nota
          </button>
        ) : (
          visibleNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSave={handleUpdateNote}
              onDelete={handleDeleteNote}
            />
          ))
        )}
      </div>

      {/* Modal: nueva nota */}
      <NoteEditDialog
        note={newNote}
        isNew
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateNote}
        onCancel={() => setCreateOpen(false)}
      />

      {/* Modal: todas las notas */}
      <Dialog open={allOpen} onOpenChange={setAllOpen}>
        <DialogContent className="max-w-[min(32rem,95vw)] max-h-[85dvh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Notas ({notes.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-2">
            <div className="flex flex-col gap-2 pb-4">
              {sorted.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onSave={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  alwaysExpanded
                />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
