"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Trash2, Check, X, Maximize2, Pencil } from "lucide-react";
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

interface NoteCardProps {
  note: Note;
  isNew?: boolean;
  onSave: (note: Note) => Promise<void>;
  onDelete?: (noteId: number) => Promise<void>;
  onCancel?: () => void;
  fullWidth?: boolean;
}

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

function NoteExpandDialog({
  note,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  note: Note;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (note: Note) => Promise<void>;
  onDelete?: (noteId: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  const handleOpenChange = (v: boolean) => {
    if (!v) setEditing(false);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl w-full">
        <DialogTitle className="text-base font-semibold">
          {note.name || "Sin título"}
        </DialogTitle>
        {editing ? (
          <NoteEditForm
            note={note}
            isNew={false}
            onSave={async (n) => { await onSave(n); setEditing(false); }}
            onDelete={onDelete}
            onClose={() => handleOpenChange(false)}
          />
        ) : (
          <div className="space-y-4">
            {note.createdAt && (
              <p className="text-[11px] text-muted-foreground">
                {new Date(note.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 min-h-[80px]">
              {note.text}
            </p>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function NoteCard({ note, isNew = false, onSave, onDelete, onCancel, fullWidth = false }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [expandOpen, setExpandOpen] = useState(false);

  if (isEditing) {
    return (
      <div className={cn("rounded-lg border ring-2 ring-primary/50 bg-card p-3", fullWidth ? "w-full" : "min-w-[240px] max-w-[240px]")}>
        <NoteEditForm
          note={note}
          isNew={isNew}
          onSave={async (n) => { await onSave(n); setIsEditing(false); }}
          onDelete={onDelete}
          onCancel={onCancel}
          onClose={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card hover:bg-accent/50 transition-colors group px-2.5 py-2 cursor-pointer",
          fullWidth ? "w-full" : "min-w-[240px] max-w-[240px]"
        )}
        onClick={() => setIsEditing(true)}
      >
        <div className="flex items-start justify-between gap-1 mb-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground flex-1 truncate">
            {note.name || "Sin título"}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {note.createdAt && (
              <span className="text-[9px] text-muted-foreground/40">
                {new Date(note.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); setExpandOpen(true); }}
              title="Abrir nota"
            >
              <Maximize2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-foreground/80 leading-snug line-clamp-4 whitespace-pre-wrap">{note.text}</p>
      </div>

      <NoteExpandDialog
        note={note}
        open={expandOpen}
        onOpenChange={setExpandOpen}
        onSave={async (n) => { await onSave(n); setExpandOpen(false); }}
        onDelete={onDelete}
      />
    </>
  );
}
