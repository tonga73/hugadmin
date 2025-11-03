"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditableSelectProps {
  value: string;
  options: string[] | Record<string, any>;
  onSave: (value: string) => void;
  renderDisplay?: () => React.ReactNode;
  getLabel?: (option: string) => string;
}

export function EditableSelect({
  value,
  options,
  onSave,
  renderDisplay,
  getLabel,
}: EditableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    onSave(newValue);
    setIsOpen(false);
  };

  const optionsArray = Array.isArray(options) ? options : Object.keys(options);

  return (
    <Select
      open={isOpen}
      onOpenChange={setIsOpen}
      value={value}
      onValueChange={handleValueChange}
    >
      <SelectTrigger
        className="border-none bg-transparent p-0 h-auto hover:bg-white/5 rounded transition-colors"
        onClick={() => setIsOpen(true)}
      >
        {renderDisplay ? renderDisplay() : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {optionsArray.map((option) => (
          <SelectItem key={option} value={option}>
            {getLabel ? getLabel(option) : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
