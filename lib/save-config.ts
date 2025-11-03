import { useEffect, useRef } from "react";

// Configuración del modo de guardado
export type SaveMode = "manual" | "onBlur" | "debounce";

export interface SaveConfig {
  mode: SaveMode;
  debounceMs?: number; // Solo si mode === "debounce"
}

// 🔹 CAMBIA AQUÍ EL MODO DE GUARDADO
export const SAVE_CONFIG: SaveConfig = {
  mode: "manual", // "manual" | "onBlur" | "debounce"
  debounceMs: 1000, // 1 segundo de delay si usas debounce
};

// Hook de debounce para el modo automático
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  };
}
