"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAVE_CONFIG } from "@/lib/save-config";

interface EditableListProps {
  items: string[];
  onSave: (items: string[]) => void;
  className?: string;
}

export function EditableList({ items, onSave, className }: EditableListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localItems, setLocalItems] = useState(items);
  const [newItem, setNewItem] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const newItemRef = useRef<HTMLInputElement>(null);
  const { mode } = SAVE_CONFIG;

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    if (isEditing && newItemRef.current) {
      newItemRef.current.focus();
    }
  }, [isEditing]);

  const handleAddItem = () => {
    if (newItem.trim()) {
      const updated = [...localItems, newItem.trim()];
      setLocalItems(updated);
      setNewItem("");
      onSave(updated);
      // Mantener foco en el input para agregar más
      setTimeout(() => newItemRef.current?.focus(), 0);
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);
    onSave(updated);
  };

  const handleUpdateItem = (index: number, value: string) => {
    const updated = [...localItems];
    updated[index] = value;
    setLocalItems(updated);
  };

  const handleItemBlur = (index: number) => {
    if (localItems[index].trim() === "") {
      handleRemoveItem(index);
    } else if (localItems[index] !== items[index]) {
      onSave(localItems);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index?: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === undefined) {
        handleAddItem();
      } else {
        // Guardar el item actual y mover foco al input de nuevo item
        handleItemBlur(index);
        newItemRef.current?.focus();
      }
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setNewItem("");
    }
    // Tab en el último item o en el input vacío cierra la edición
    if (e.key === "Tab" && !e.shiftKey && index === undefined && !newItem.trim()) {
      setIsEditing(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setNewItem("");
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-1 animate-in fade-in duration-150", className)}>
        {localItems.map((item, index) => (
          <div key={index} className="flex items-center gap-1 group">
            <span className="text-muted-foreground/50 text-xs w-3">•</span>
            <Input
              value={item}
              onChange={(e) => handleUpdateItem(index, e.target.value)}
              onBlur={() => handleItemBlur(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="flex-1 h-7 text-sm bg-accent/30 border-transparent focus:border-primary/20 focus:bg-accent/50"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
              onClick={() => handleRemoveItem(index)}
              title="Eliminar"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {/* Input para agregar nuevo */}
        <div className="flex items-center gap-1 pt-0.5">
          <span className="text-primary/50 text-xs w-3">+</span>
          <Input
            ref={newItemRef}
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
            placeholder="Agregar..."
            className="flex-1 h-7 text-sm bg-transparent border-dashed border-muted-foreground/20 focus:border-primary/30 placeholder:text-muted-foreground/40"
          />
          {newItem.trim() && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
              onClick={handleAddItem}
              title="Agregar (Enter)"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Botón para cerrar */}
        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    );
  }

  const isEmpty = items.length === 0;

  return (
    <div
      className={cn(
        "group relative cursor-pointer rounded-md transition-all duration-150",
        "hover:bg-accent/30",
        className
      )}
      onClick={() => setIsEditing(true)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Click para editar"
    >
      {isEmpty ? (
        <p className="text-muted-foreground/40 italic text-sm py-1">
          Click para agregar
        </p>
      ) : (
        <ul className="space-y-0.5">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground/50">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      
      {/* Indicador de edición */}
      <Pencil 
        className={cn(
          "absolute right-1 top-1 h-3 w-3 text-muted-foreground/50",
          "transition-opacity duration-150",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
