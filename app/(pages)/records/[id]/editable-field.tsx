"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAVE_CONFIG, useDebounce } from "@/lib/save-config";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  isDescription?: boolean;
  multiline?: boolean;
}

export function EditableField({
  value,
  onSave,
  className,
  style,
  placeholder,
  isDescription,
  multiline,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const { mode, debounceMs } = SAVE_CONFIG;

  // Hook de debounce para guardado automático
  const debouncedSave = useDebounce(() => {
    if (localValue !== value && localValue.trim() !== "") {
      onSave(localValue);
    }
  }, debounceMs || 1000);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Seleccionar todo el texto
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      } else if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.setSelectionRange(0, inputRef.current.value.length);
      }
    }
  }, [isEditing]);

  const handleSave = () => {
    if (localValue !== value && localValue.trim() !== "") {
      onSave(localValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // No cerrar si el click fue en los botones de guardar/cancelar
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('[data-editable-actions]')) {
      return;
    }
    
    if (mode === "onBlur" || mode === "debounce") {
      handleSave();
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    return (
      <div className="flex items-start gap-1.5 group animate-in fade-in duration-150">
        <InputComponent
          ref={inputRef as any}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            if (mode === "debounce") {
              debouncedSave();
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "bg-accent/50 border border-primary/20 flex-1 transition-all",
            "focus:border-primary/40 focus:bg-accent/70",
            isDescription && "text-muted-foreground",
            multiline && "min-h-[60px] resize-none",
            className
          )}
          style={style}
          placeholder={placeholder}
        />
        {mode === "manual" && (
          <div className="flex gap-0.5 shrink-0" data-editable-actions>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              onClick={handleSave}
              title="Guardar (Enter)"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={handleCancel}
              title="Cancelar (Esc)"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const isEmpty = !value || value.trim() === "";

  return (
    <div
      onClick={() => setIsEditing(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative cursor-pointer rounded-md px-2 py-0.5 -mx-2 transition-all duration-150",
        "hover:bg-accent/50",
        isDescription && "text-muted-foreground",
        isEmpty && "min-h-[1.5em]",
        className
      )}
      style={style}
      title="Click para editar"
    >
      <span className={cn(isEmpty && "text-muted-foreground/40 italic")}>
        {isEmpty ? placeholder || "Click para editar" : value}
      </span>
      
      {/* Indicador de edición */}
      <Pencil 
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50",
          "transition-opacity duration-150",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
