"use client";

import { Search, X } from "lucide-react";
import { Record } from "@/app/generated/prisma/client";
import { TRACING_OPTIONS } from "@/app/constants";
import { TracingBadge } from "./tracing-badge";
import { CommandDialog, CommandInput } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefObject } from "react";

interface CommandSearchProps {
  // State
  open: boolean;
  query: string;
  loading: boolean;
  results: Record[];
  hasMore: boolean;
  selectedIndex: number;
  pinnedQuery: string;
  filteredCount: number;
  // Refs
  itemsRef: RefObject<HTMLButtonElement[]>;
  // Actions
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onSelect: (record: Record) => void;
  onSelectedIndexChange: (index: number) => void;
  onLoadMore: () => void;
  onClearPinned: () => void;
}

export function CommandSearch({
  open,
  query,
  loading,
  results,
  hasMore,
  selectedIndex,
  pinnedQuery,
  filteredCount,
  itemsRef,
  onOpenChange,
  onQueryChange,
  onSelect,
  onSelectedIndexChange,
  onLoadMore,
  onClearPinned,
}: CommandSearchProps) {
  return (
    <div className="sticky top-0 z-20 bg-background px-2 py-3 space-y-2">
      {/* Botón trigger */}
      <button
        className="flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm bg-transparent"
        onClick={() => onOpenChange(true)}
        aria-label="Buscar expedientes (Cmd/Ctrl+K)"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground truncate flex-1 text-left">
          {pinnedQuery || "Buscar..."}
        </span>
        <span className="text-xs text-muted-foreground">⌘K</span>
      </button>

      {/* Indicador de búsqueda fijada */}
      {pinnedQuery && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground truncate flex-1">
            Filtro: &quot;{pinnedQuery}&quot; ({filteredCount} resultados)
          </span>
          <button
            onClick={onClearPinned}
            className="shrink-0 p-1 rounded hover:bg-accent transition-colors"
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Command Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        className="top-0 left-0 translate-x-0 translate-y-0 w-full h-full max-w-none rounded-none p-0"
      >
        <CommandInput
          value={query}
          onValueChange={onQueryChange}
          placeholder="Buscar por orden, nombre o tracing..."
        />

        <ScrollArea className="h-[calc(100vh-100px)] w-full">
          <div className="w-full">
            {loading && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Buscando...
              </div>
            )}

            {!loading && results.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No se encontraron expedientes.
              </div>
            )}

            {!loading && results.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-muted-foreground sticky top-0 bg-background">
                  {query?.trim()
                    ? `Resultados para "${query}"`
                    : "Últimos modificados"}
                </div>

                <div className="divide-y">
                  {results.map((record, index) => (
                    <CommandResultItem
                      key={record.id}
                      record={record}
                      isSelected={selectedIndex === index}
                      ref={(el) => {
                        if (el) itemsRef.current[index] = el;
                      }}
                      onClick={() => onSelect(record)}
                      onMouseEnter={() => onSelectedIndexChange(index)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="px-3 py-3 border-t">
                    <button
                      onClick={onLoadMore}
                      disabled={loading}
                      className="w-full py-2 px-3 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                    >
                      {loading ? "Cargando..." : "Cargar más"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CommandDialog>
    </div>
  );
}

// Componente interno para cada resultado
import { forwardRef } from "react";

interface CommandResultItemProps {
  record: Record;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

const CommandResultItem = forwardRef<HTMLButtonElement, CommandResultItemProps>(
  ({ record, isSelected, onClick, onMouseEnter }, ref) => {
    const formattedDate =
      typeof record.updatedAt === "string"
        ? new Date(record.updatedAt).toLocaleString()
        : record.updatedAt
        ? new Date(record.createdAt).toLocaleString()
        : "";

    return (
      <button
        ref={ref}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`w-full px-3 py-2 text-left transition-colors ${
          isSelected ? "bg-accent" : "hover:bg-accent/50"
        }`}
      >
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">
              {record.order} — {record.name}
            </div>
            <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <TracingBadge tracing={record.tracing} />
              {TRACING_OPTIONS[record.tracing as keyof typeof TRACING_OPTIONS]
                ?.label || record.tracing}
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0">
            {formattedDate}
          </div>
        </div>
      </button>
    );
  }
);

CommandResultItem.displayName = "CommandResultItem";

