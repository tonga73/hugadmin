"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Trash2, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

export function NoteCard({
  note,
  isNew = false,
  onSave,
  onDelete,
  onCancel,
  fullWidth = false,
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedName, setEditedName] = useState(note.name || "");
  const [editedText, setEditedText] = useState(note.text || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus en el input de título cuando está en modo edición
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Verificar si hay cambios
  const hasChanges =
    editedName !== (note.name || "") || editedText !== (note.text || "");

  const handleSave = async () => {
    if (!editedText.trim()) return;

    // Si es edición de nota existente y hay cambios, pedir confirmación
    if (!isNew && hasChanges) {
      setShowSaveConfirm(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
    setIsSaving(true);
    setShowSaveConfirm(false);
    try {
      await onSave({
        ...note,
        name: editedName.trim() || null,
        text: editedText.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const performDelete = async () => {
    if (!note.id || !onDelete) return;

    setIsDeleting(true);
    setShowDeleteConfirm(false);
    try {
      await onDelete(note.id);
    } catch (error) {
      console.error("Error deleting note:", error);
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (isNew && onCancel) {
      onCancel();
    } else {
      setEditedName(note.name || "");
      setEditedText(note.text || "");
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    }
    // Ctrl/Cmd + Enter para guardar
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <>
        <div className={cn(
          "rounded-lg border ring-2 ring-primary/50 bg-card flex flex-col gap-0",
          fullWidth ? "w-full" : "min-w-[240px] max-w-[240px]"
        )}>
          <div className="px-2.5 pt-2">
            <Input
              ref={inputRef}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Título (opcional)"
              className="h-5 text-[10px] font-semibold bg-transparent border-0 border-b border-dashed focus-visible:ring-0 rounded-none px-0 text-muted-foreground"
            />
          </div>
          <div className="px-2.5 pt-1.5 pb-2 flex flex-col gap-1.5">
            <Textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Contenido..."
              className="min-h-[60px] max-h-[160px] resize-none text-xs leading-snug"
              autoFocus={!isNew}
            />
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] text-muted-foreground/40">⌘↵ guardar</span>
              <div className="flex gap-0.5">
                <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isSaving} className="h-5 w-5">
                  <X className="h-2.5 w-2.5" />
                </Button>
                <Button size="icon" onClick={handleSave} disabled={isSaving || !editedText.trim()} className="h-5 w-5">
                  {isSaving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Check className="h-2.5 w-2.5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmación de guardar */}
        <ConfirmDialog
          open={showSaveConfirm}
          onOpenChange={setShowSaveConfirm}
          title="Guardar cambios"
          description="¿Estás seguro de que deseas guardar los cambios en esta nota?"
          confirmText="Guardar"
          cancelText="Cancelar"
          onConfirm={performSave}
          loading={isSaving}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors group px-2.5 py-2",
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
                {new Date(note.createdAt).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
            )}
            {note.id && onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <Trash2 className="h-2.5 w-2.5 text-destructive" />
                )}
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-foreground/80 leading-snug whitespace-pre-wrap">{note.text}</p>
      </div>

      {/* Confirmación de eliminar */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar nota"
        description={`¿Estás seguro de que deseas eliminar la nota "${note.name || "sin título"}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={performDelete}
        loading={isDeleting}
      />
    </>
  );
}
