"use client";

import { Search, X } from "lucide-react";
import { Record } from "@/app/generated/prisma/client";
import { TRACING_OPTIONS } from "@/app/constants";
import { TracingBadge } from "./tracing-badge";
import { CommandDialog, CommandInput } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { RefObject, useRef, useEffect } from "react";

// Skeleton que simula un resultado de búsqueda
function CommandResultSkeleton() {
  return (
    <div className="px-3 py-2 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-14 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-3 w-24 shrink-0" />
      </div>
    </div>
  );
}

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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll para cargar más resultados
  useEffect(() => {
    if (!open || !hasMore || loading) return;

    const scrollArea = scrollAreaRef.current;
    const sentinel = sentinelRef.current;
    if (!scrollArea || !sentinel) return;

    // Buscar el viewport del ScrollArea
    const viewport = scrollArea.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { root: viewport, rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasMore, loading, onLoadMore]);

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

        <ScrollArea className="h-[calc(100vh-100px)] w-full" ref={scrollAreaRef}>
          <div className="w-full">
            {/* Estado de carga inicial */}
            {loading && results.length === 0 && (
              <div className="divide-y">
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Buscando...
                </div>
                <CommandResultSkeleton />
                <CommandResultSkeleton />
                <CommandResultSkeleton />
                <CommandResultSkeleton />
                <CommandResultSkeleton />
              </div>
            )}

            {/* Sin resultados */}
            {!loading && results.length === 0 && (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No se encontraron expedientes
                </p>
                {query?.trim() && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Intenta con otros términos de búsqueda
                  </p>
                )}
              </div>
            )}

            {/* Resultados */}
            {results.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-muted-foreground sticky top-0 bg-background z-10 border-b">
                  {query?.trim()
                    ? `${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
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

                {/* Sentinel para infinite scroll */}
                {hasMore && <div ref={sentinelRef} className="h-4" />}

                {/* Cargando más resultados */}
                {loading && (
                  <div className="divide-y">
                    <CommandResultSkeleton />
                    <CommandResultSkeleton />
                  </div>
                )}

                {/* Fin de resultados */}
                {!hasMore && !loading && (
                  <div className="py-3 text-center">
                    <span className="text-[10px] text-muted-foreground/50">
                      — {results.length} expedientes —
                    </span>
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

