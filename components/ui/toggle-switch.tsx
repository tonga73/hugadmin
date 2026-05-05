"use client";

import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({ checked, onCheckedChange, disabled, className }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "relative w-9 h-5 rounded-full transition-colors shrink-0 overflow-hidden",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200",
          checked ? "translate-x-[17px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
