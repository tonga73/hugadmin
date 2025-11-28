"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Trash2, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
}

export function NoteCard({
  note,
  isNew = false,
  onSave,
  onDelete,
  onCancel,
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
        <Card className="gap-0 min-w-[280px] max-w-[280px] ring-2 ring-primary/50 flex flex-col">
          <CardHeader className="py-2 px-3">
            <Input
              ref={inputRef}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Título (opcional)"
              className="h-7 text-xs font-medium bg-transparent border-0 border-b border-dashed focus-visible:ring-0 rounded-none px-0"
            />
          </CardHeader>
          <CardContent className="py-2 px-3 flex flex-col gap-2">
            <Textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Contenido de la nota..."
              className="min-h-[60px] max-h-[80px] resize-none text-xs"
              autoFocus={!isNew}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] text-muted-foreground">
                ⌘↵ guardar
              </span>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSave}
                  disabled={isSaving || !editedText.trim()}
                  className="h-6 w-6"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
      <Card
        className="gap-0 min-w-[280px] max-w-[280px] cursor-pointer hover:bg-accent/50 transition-colors group flex flex-col"
        onClick={() => setIsEditing(true)}
      >
        <CardHeader className="py-2 px-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-white/50 text-xs flex-1 truncate">
              {note.name || "Nota sin título"}
            </CardTitle>
            {note.id && onDelete && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 text-destructive" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="py-2 px-3 pt-0">
          <p className="text-xs line-clamp-3">{note.text}</p>
        </CardContent>
      </Card>

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
