"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Trash2, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface Note {
  id?: number;
  name: string | null;
  text: string;
  recordId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Edit form (shared between create and edit modal) ──────────────────────────

function NoteEditForm({
  note,
  isNew,
  onSave,
  onDelete,
  onCancel,
  onClose,
}: {
  note: Note;
  isNew: boolean;
  onSave: (note: Note) => Promise<void>;
  onDelete?: (noteId: number) => Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedName, setEditedName] = useState(note.name || "");
  const [editedText, setEditedText] = useState(note.text || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChanges = editedName !== (note.name || "") || editedText !== (note.text || "");

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const performSave = async () => {
    if (!editedText.trim()) return;
    setIsSaving(true);
    setShowSaveConfirm(false);
    try {
      await onSave({ ...note, name: editedName.trim() || null, text: editedText.trim() });
      onClose?.();
    } catch {
      // error handled upstream
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!editedText.trim()) return;
    if (!isNew && hasChanges) { setShowSaveConfirm(true); return; }
    performSave();
  };

  const performDelete = async () => {
    if (!note.id || !onDelete) return;
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await onDelete(note.id);
      onClose?.();
    } catch {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isNew) onCancel?.();
    else onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleCancel();
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSave();
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Input
          ref={inputRef}
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Título (opcional)"
          className="text-sm font-semibold"
        />
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Contenido..."
          className="min-h-[120px] resize-none text-sm leading-relaxed"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground/40">⌘↵ guardar</span>
          <div className="flex gap-1.5">
            {note.id && onDelete && (
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(true)} disabled={isDeleting} className="text-destructive hover:text-destructive">
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || !editedText.trim()}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              Guardar
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm} title="Guardar cambios"
        description="¿Guardás los cambios en esta nota?" confirmText="Guardar" cancelText="Cancelar"
        onConfirm={performSave} loading={isSaving} />
      <ConfirmDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} title="Eliminar nota"
        description={`¿Eliminás la nota "${note.name || "sin título"}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar" cancelText="Cancelar" variant="destructive"
        onConfirm={performDelete} loading={isDeleting} />
    </>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

export function NoteEditDialog({
  note,
  isNew = false,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onCancel,
}: {
  note: Note;
  isNew?: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (note: Note) => Promise<void>;
  onDelete?: (noteId: number) => Promise<void>;
  onCancel?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(32rem,95vw)]">
        <DialogTitle className="text-sm font-semibold">
          {isNew ? "Nueva nota" : (note.name || "Editar nota")}
        </DialogTitle>
        <NoteEditForm
          note={note}
          isNew={isNew}
          onSave={async (n) => { await onSave(n); onOpenChange(false); }}
          onDelete={onDelete}
          onCancel={() => { onCancel?.(); onOpenChange(false); }}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ── Note card (view + expand + edit trigger) ──────────────────────────────────

interface NoteCardProps {
  note: Note;
  onSave: (note: Note) => Promise<void>;
  onDelete?: (noteId: number) => Promise<void>;
  alwaysExpanded?: boolean;
}

export function NoteCard({ note, onSave, onDelete, alwaysExpanded = false }: NoteCardProps) {
  const [expanded, setExpanded] = useState(alwaysExpanded);
  const [editOpen, setEditOpen] = useState(false);

  const dateLabel = note.createdAt
    ? new Date(note.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "2-digit" })
    : null;

  return (
    <>
      <div className="rounded-lg border bg-card">
        {/* Header: edit button — no es zona de expand */}
        <div className="flex items-center gap-1.5 px-2.5 pt-2 pb-1 select-none">
          <span className="text-[10px] font-semibold text-muted-foreground flex-1 truncate">
            {note.name || "Sin título"}
          </span>
          {dateLabel && (
            <span className="text-[9px] text-muted-foreground/40 shrink-0">{dateLabel}</span>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-5 w-5 shrink-0 text-muted-foreground/30 hover:text-muted-foreground hover:bg-transparent"
            onClick={() => setEditOpen(true)}
            title="Editar nota"
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>

        {/* Body: click para expandir/colapsar */}
        <div
          className={cn("px-2.5 pb-2", !alwaysExpanded && "cursor-pointer hover:opacity-80 transition-opacity")}
          onClick={() => !alwaysExpanded && setExpanded((v) => !v)}
        >
          <p className={cn(
            "text-xs text-foreground/80 leading-snug",
            expanded || alwaysExpanded ? "whitespace-pre-wrap" : "line-clamp-4"
          )}>
            {note.text}
          </p>
          {!alwaysExpanded && (
            <span className="text-[9px] text-muted-foreground/30 mt-0.5 block">
              {expanded ? "↑ contraer" : ""}
            </span>
          )}
        </div>
      </div>

      <NoteEditDialog
        note={note}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={onSave}
        onDelete={onDelete}
      />
    </>
  );
}
