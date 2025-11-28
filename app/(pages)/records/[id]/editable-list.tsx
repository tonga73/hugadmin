"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAVE_CONFIG, useDebounce } from "@/lib/save-config";

interface EditableListProps {
  items: string[];
  onSave: (items: string[]) => void;
  className?: string;
}

export function EditableList({ items, onSave, className }: EditableListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localItems, setLocalItems] = useState(items);
  const [newItem, setNewItem] = useState("");
  const { mode, debounceMs } = SAVE_CONFIG;

  // Debounced save para modo automático
  const debouncedSave = useDebounce((updatedItems: string[]) => {
    onSave(updatedItems);
  }, debounceMs || 1000);

  const handleSave = () => {
    const filtered = localItems.filter((item) => item.trim() !== "");
    onSave(filtered);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalItems(items);
    setNewItem("");
    setIsEditing(false);
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      const updated = [...localItems, newItem.trim()];
      setLocalItems(updated);
      setNewItem("");

      if (mode !== "manual") {
        onSave(updated);
      }
    }
  };

  const handleRemoveItem = (index: number) => {
    const updated = localItems.filter((_, i) => i !== index);
    setLocalItems(updated);

    if (mode !== "manual") {
      onSave(updated);
    }
  };

  const handleUpdateItem = (index: number, value: string) => {
    const updated = [...localItems];
    updated[index] = value;
    setLocalItems(updated);

    // Trigger debounce save si está en modo debounce
    if (mode === "debounce") {
      debouncedSave(updated);
    }
  };

  const handleItemBlur = (index: number) => {
    if (mode === "manual") return;

    if (localItems[index].trim() === "") {
      handleRemoveItem(index);
    } else {
      onSave(localItems);
    }
  };

  if (isEditing) {
    return (
      <div className={className}>
        {localItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2 mb-1.5">
            <span className="text-muted-foreground">-</span>
            <Input
              value={item}
              onChange={(e) => handleUpdateItem(index, e.target.value)}
              onBlur={() => handleItemBlur(index)}
              className="flex-1 h-8 text-sm"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-500 hover:text-red-600"
              onClick={() => handleRemoveItem(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddItem();
              }
              if (e.key === "Escape") {
                if (mode === "manual") {
                  handleCancel();
                } else {
                  setIsEditing(false);
                }
              }
            }}
            placeholder="Agregar nuevo..."
            className="flex-1 h-8 text-sm"
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-green-500 hover:text-green-600"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {mode === "manual" && (
          <div className="flex gap-2 mt-3 justify-end">
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "cursor-pointer hover:bg-white/5 rounded transition-colors",
        className
      )}
      onClick={() => setIsEditing(true)}
      title="Click para editar"
    >
      {items.length > 0 ? (
        items.map((item, index) => <li key={index}>- {item}</li>)
      ) : (
        <li className="text-muted-foreground/50 italic">Click para agregar</li>
      )}
    </ul>
  );
}
