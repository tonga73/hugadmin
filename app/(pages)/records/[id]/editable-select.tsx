"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EditableSelectProps {
  value: string;
  options: string[] | Record<string, any>;
  onSave: (value: string) => void;
  renderDisplay?: () => React.ReactNode;
  getLabel?: (option: string) => string;
  className?: string;
}

export function EditableSelect({
  value,
  options,
  onSave,
  renderDisplay,
  getLabel,
  className,
}: EditableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    if (newValue !== value) {
      onSave(newValue);
    }
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
        className={cn(
          "w-auto border-none bg-transparent shadow-none p-0 h-auto",
          "rounded-md transition-all duration-150",
          "focus:ring-0 focus:ring-offset-0",
          "hover:scale-[1.02] hover:brightness-110",
          "active:scale-100",
          "cursor-pointer [&>svg]:hidden",
          className
        )}
        onClick={() => setIsOpen(true)}
        title="Click para cambiar"
      >
        {renderDisplay ? (
          <span className="transition-transform">
            {renderDisplay()}
          </span>
        ) : (
          <span>{value}</span>
        )}
      </SelectTrigger>
      <SelectContent 
        align="start"
        className="min-w-[180px]"
      >
        {optionsArray.map((option) => (
          <SelectItem 
            key={option} 
            value={option}
            className={cn(
              "cursor-pointer",
              option === value && "bg-accent"
            )}
          >
            {getLabel ? getLabel(option) : option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
