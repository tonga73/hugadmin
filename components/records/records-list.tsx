"use client";

import { useState } from "react";
import { Record } from "@/app/generated/prisma/client";
import { PRIORITY_OPTIONS } from "@/app/constants";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { useRecordsList } from "@/hooks/use-records-list";
import { formatOrder } from "@/lib/record-number";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { CommandSearch } from "./command-search";
import { HighlightedRecordCard } from "./highlighted-record-card";
import { TracingBadge } from "./tracing-badge";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton que simula un item de la lista
function RecordItemSkeleton() {
  return (
    <div className="px-2 py-1.5 border-l-[3px] border-muted-foreground/20 animate-pulse">
      <div className="flex items-center justify-between gap-2 mb-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

interface RecordsListProps {
  initialRecords: Record[];
  lastId: number | null;
  hasMore: boolean;
  initialTracingFilter?: string[];
  initialMinPriority?: string | null;
  initialMine?: boolean;
  initialFavoritesOnly?: boolean;
}

export function RecordsList({
  initialRecords,
  lastId,
  hasMore,
  initialTracingFilter = [],
  initialMinPriority = null,
  initialMine = false,
  initialFavoritesOnly = false,
}: RecordsListProps) {
  const {
    // State
    filteredRecords,
    selectedIndex,
    loading,
    more,
    pinnedQuery,
    highlightedRecord,
    records,
    tracingFilter,
    minPriority,
    mine,
    favoritesOnly,
    // Command state
    commandOpen,
    commandQuery,
    commandLoading,
    commandResults,
    commandHasMore,
    commandSelectedIndex,
    // Refs
    scrollRef,
    sentinelRef,
    itemsRef,
    highlightedRef,
    commandItemsRef,
    // Actions
    setCommandQuery,
    setCommandSelectedIndex,
    setHighlightedRecord,
    handleItemClick,
    handleCommandSelect,
    handleCommandClose,
    loadMoreCommandResults,
    clearPinnedSearch,
    toggleTracingKey,
    updateTracingFilter,
    updateMinPriority,
    // Router
    router,
    pathname,
  } = useRecordsList({ initialRecords, lastId, hasMore, initialTracingFilter, initialMinPriority, initialMine, initialFavoritesOnly });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = tracingFilter.length + (minPriority ? 1 : 0) + (mine ? 1 : 0) + (favoritesOnly ? 1 : 0);

  return (
    <div className="w-full">
      {/* Buscador */}
      <CommandSearch
          open={commandOpen}
        query={commandQuery}
        loading={commandLoading}
        results={commandResults}
        hasMore={commandHasMore}
        selectedIndex={commandSelectedIndex}
        pinnedQuery={pinnedQuery}
        filteredCount={filteredRecords.length}
        itemsRef={commandItemsRef}
        onOpenChange={handleCommandClose}
        onQueryChange={setCommandQuery}
        onSelect={handleCommandSelect}
        onSelectedIndexChange={setCommandSelectedIndex}
        onLoadMore={loadMoreCommandResults}
        onClearPinned={clearPinnedSearch}
      />

      {/* Filtros — trigger */}
      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-2 py-1.5 border-b border-border/40 transition-colors text-left",
          filtersOpen ? "bg-muted/40" : "hover:bg-muted/30",
          activeFilterCount > 0 ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-1.5 text-[11px] font-medium">
          <SlidersHorizontal className="h-3 w-3 shrink-0" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full px-1.5 leading-4">
              {activeFilterCount}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform",
            filtersOpen && "rotate-180"
          )}
        />
      </button>

      {/* Filtros — panel */}
      {filtersOpen && (
        <div className="border-b border-border/40 bg-muted/20 px-2 py-2.5 space-y-3">

          {/* Estado */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Estado
              </p>
              {tracingFilter.length > 0 && (
                <button
                  onClick={() => updateTracingFilter([])}
                  className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-0.5"
                >
                  <X className="h-2.5 w-2.5" /> Todos
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {Object.entries(TRACING_OPTIONS).map(([key, opt]) => {
                const active = tracingFilter.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleTracingKey(key)}
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                      active ? "opacity-100" : "opacity-55 hover:opacity-75"
                    )}
                    style={
                      active
                        ? { backgroundColor: opt.color, color: opt.textColor, borderColor: opt.color }
                        : { borderColor: opt.color, color: opt.textColor }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prioridad mínima */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Prioridad mínima
              </p>
              {minPriority && (
                <button
                  onClick={() => updateMinPriority(null)}
                  className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-0.5"
                >
                  <X className="h-2.5 w-2.5" /> Todas
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/60 leading-snug">
              Muestra expedientes con esta prioridad o mayor.
            </p>
            <div className="flex flex-wrap gap-1">
              {(["BAJA", "MEDIA", "ALTA", "URGENTE"] as const).map((p) => {
                const opt = PRIORITY_OPTIONS[p];
                const active = minPriority === p;
                return (
                  <button
                    key={p}
                    onClick={() => updateMinPriority(active ? null : p)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all",
                      active ? "opacity-100" : "opacity-55 hover:opacity-75"
                    )}
                    style={
                      active
                        ? { backgroundColor: opt.color, borderColor: opt.color, color: "#1a1a1a" }
                        : { borderColor: opt.color, color: opt.color }
                    }
                  >
                    {opt.label}+
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Lista de records */}
      <ScrollArea className="h-[calc(100vh-230px)]" ref={scrollRef}>
        {/* Record destacado */}
        {highlightedRecord && (
          <HighlightedRecordCard
            ref={highlightedRef}
            record={highlightedRecord}
            onClose={() => setHighlightedRecord(null)}
            onClick={() => {
              const targetPath = `/records/${highlightedRecord.id}`;
              router.push(pathname === targetPath ? "/" : targetPath);
            }}
            showSeparator={filteredRecords.length > 0}
          />
        )}

        {/* Lista principal */}
        <SidebarMenu>
          {filteredRecords.length === 0 && !loading && !highlightedRecord ? (
            <div className="py-6 text-center">
              <p className="text-xs text-muted-foreground">
                {pinnedQuery ? "Sin resultados" : "No hay expedientes"}
              </p>
            </div>
          ) : (
            filteredRecords
              .filter(
                (r) =>
                  !highlightedRecord ||
                  Number(r.id) !== Number(highlightedRecord.id)
              )
              .map((record) => {
                const actualIndex = filteredRecords.findIndex(
                  (r) => r.id === record.id
                );
                const isSelected = selectedIndex === actualIndex;

                return (
                  <SidebarMenuItem
                    key={record.id}
                    ref={(el) => {
                      if (el) itemsRef.current[actualIndex] = el;
                    }}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isSelected ? "bg-accent/80" : "hover:bg-accent/40"
                    }`}
                    style={{
                      borderLeft: `3px solid ${
                        PRIORITY_OPTIONS[record.priority].color
                      }`,
                    }}
                  >
                    <SidebarMenuButton asChild className="h-auto max-h-full">
                      <a
                        className="flex flex-col items-start justify-start py-1"
                        onClick={() => handleItemClick(actualIndex)}
                      >
                        <span className="flex items-center gap-1.5 w-full min-w-0">
                          <span className="text-sm font-medium shrink-0">{formatOrder(record.order)}</span>
                          {record.code && (
                            <span className="text-[10px] font-mono text-muted-foreground/50 truncate">
                              {record.code}
                            </span>
                          )}
                          <TracingBadge tracing={record.tracing} size="sm" />
                        </span>
                        <span className="text-xs text-muted-foreground truncate w-full">
                          {record.name}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })
          )}
        </SidebarMenu>

        {/* Sentinel para infinite scroll */}
        {more && <div ref={sentinelRef} className="h-4" />}

        {/* Loading indicator */}
        {loading && (
          <div className="space-y-1 px-1">
            <RecordItemSkeleton />
            <RecordItemSkeleton />
          </div>
        )}

        {/* Indicador de carga inline más sutil */}
        {more && !loading && (
          <div className="py-2 text-center">
            <span className="text-[10px] text-muted-foreground/50">
              Desplaza para cargar más
            </span>
          </div>
        )}

        {/* End of list message */}
        {!more && records.length > 0 && (
          <div className="py-3 text-center">
            <span className="text-[10px] text-muted-foreground/50">
              — {records.length} expedientes —
            </span>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
