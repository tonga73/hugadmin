"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const btn = "flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      id="tour-mode-toggle"
      onClick={toggle}
      className={cn(btn)}
      title="Cambiar tema"
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90 absolute" />
      <Moon className="h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0 absolute" />
      <span className="sr-only">Cambiar tema</span>
    </button>
  );
}
