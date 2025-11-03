"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
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
      inputRef.current.select();
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
      if (mode === "manual") return; // Solo guardar con botón
      handleSave();
    }
    if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleBlur = () => {
    if (mode === "onBlur") {
      handleSave();
    }
  };

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;
    return (
      <div className="flex items-center gap-2">
        <InputComponent
          ref={inputRef as any}
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            // Trigger debounce save si está en modo debounce
            if (mode === "debounce") {
              debouncedSave();
            }
          }}
          onBlur={mode === "manual" ? undefined : handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "bg-transparent border-dashed flex-1",
            isDescription && "text-white/50",
            className
          )}
          style={style}
          placeholder={placeholder}
        />
        {mode === "manual" && (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-green-500 hover:text-green-600"
              onClick={handleSave}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-white/5 rounded px-2 py-1 transition-colors",
        isDescription && "text-white/50",
        className
      )}
      style={style}
      title="Click para editar"
    >
      {value || <span className="text-white/30 italic">{placeholder}</span>}
    </div>
  );
}
