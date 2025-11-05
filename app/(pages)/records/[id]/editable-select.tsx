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
        className="w-min border-none bg-transparent! shadow-none p-0 h-auto rounded transition-all focus:ring-0 focus:ring-offset-0 hover:scale-105 hover:brightness-125 cursor-pointer"
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
