"use client";

import { useState } from "react";
import { Record } from "@/app/generated/prisma/client";
import { PRIORITY_OPTIONS } from "@/app/constants";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { useRecordsList } from "@/hooks/use-records-list";
import { formatOrder } from "@/lib/record-number";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, ChevronDown, X, Search, Star } from "lucide-react";
import { HighlightedRecordCard } from "./highlighted-record-card";
import { TracingBadge } from "./tracing-badge";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    filteredRecords,
    displayRecords,
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
    commandLoading,
    scrollRef,
    sentinelRef,
    itemsRef,
    highlightedRef,
    searchInputRef,
    setSearch,
    setHighlightedRecord,
    handleItemClick,
    clearPinnedSearch,
    toggleTracingKey,
    updateTracingFilter,
    updateMinPriority,
    updateMine,
    updateFavoritesOnly,
    router,
    pathname,
  } = useRecordsList({ initialRecords, lastId, hasMore, initialTracingFilter, initialMinPriority, initialMine, initialFavoritesOnly });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = tracingFilter.length + (minPriority ? 1 : 0) + (mine ? 1 : 0) + (favoritesOnly ? 1 : 0);

  return (
    <div className="flex flex-col h-full">

      {/* Search + filter bar */}
      <div className={cn("flex items-center border-b border-border/40 shrink-0", filtersOpen && "border-b-0")}>
        <div className="flex items-center gap-2 flex-1 px-3 py-1.5 min-w-0">
          {commandLoading ? (
            <span className="flex items-center gap-[3px] shrink-0 w-3.5">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
            </span>
          ) : (
            <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <input
            ref={searchInputRef}
            type="text"
            value={pinnedQuery}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") clearPinnedSearch(); }}
            placeholder="Buscar..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
          />
          {pinnedQuery && (
            <span className="text-[10px] text-muted-foreground/40 shrink-0 tabular-nums">{displayRecords.length}</span>
          )}
        </div>

        {pinnedQuery && (
          <button
            onClick={clearPinnedSearch}
            className="shrink-0 px-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        <div className="w-px h-4 bg-border/60 shrink-0" />

        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 hover:bg-muted/30 transition-colors shrink-0",
            filtersOpen && "bg-muted/40"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full px-1.5 leading-4">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", filtersOpen && "rotate-180")} />
        </button>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="border-y border-border/40 bg-muted/20 px-3 py-2.5 space-y-3 shrink-0">

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Estado</p>
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
                      active ? "opacity-100" : "opacity-70 hover:opacity-100"
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Prioridad mínima</p>
              {minPriority && (
                <button
                  onClick={() => updateMinPriority(null)}
                  className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-0.5"
                >
                  <X className="h-2.5 w-2.5" /> Todas
                </button>
              )}
            </div>
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

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Asignación</p>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => updateMine(!mine)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium border border-muted-foreground/40 transition-all",
                  mine ? "opacity-100 bg-muted-foreground/20" : "opacity-55 hover:opacity-75"
                )}
              >
                Mis expedientes
              </button>
              <button
                onClick={() => updateFavoritesOnly(!favoritesOnly)}
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium border border-amber-400/60 text-amber-500 transition-all flex items-center gap-0.5",
                  favoritesOnly ? "opacity-100 bg-amber-400/15" : "opacity-55 hover:opacity-75"
                )}
              >
                <Star className={cn("h-2.5 w-2.5", favoritesOnly && "fill-amber-400")} />
                Destacados
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Record list */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>

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

        <SidebarMenu>
          {displayRecords.length === 0 && !loading && !highlightedRecord ? (
            <div className="py-8 text-center">
              <p className="text-xs text-muted-foreground/50">
                {pinnedQuery ? "Sin resultados" : "No hay expedientes"}
              </p>
            </div>
          ) : (
            displayRecords
              .filter((r) => !highlightedRecord || Number(r.id) !== Number(highlightedRecord.id))
              .map((record) => {
                const actualIndex = displayRecords.findIndex((r) => r.id === record.id);
                const isSelected = selectedIndex === actualIndex;
                return (
                  <SidebarMenuItem
                    key={record.id}
                    ref={(el) => { if (el) itemsRef.current[actualIndex] = el; }}
                    className={cn(
                      "transition-colors duration-150 cursor-pointer",
                      isSelected ? "bg-accent/80" : "hover:bg-accent/40"
                    )}
                    style={{ borderLeft: `3px solid ${PRIORITY_OPTIONS[record.priority]?.color ?? "transparent"}` }}
                  >
                    <SidebarMenuButton asChild className="h-auto max-h-full">
                      <a
                        className="flex flex-col items-start justify-start py-1.5 px-2"
                        onClick={() => handleItemClick(actualIndex)}
                      >
                        <span className="flex items-center gap-1.5 w-full min-w-0">
                          <span className="text-[13px] font-semibold shrink-0 font-mono">
                            {formatOrder(record.order)}
                          </span>
                          <TracingBadge tracing={record.tracing} size="sm" />
                        </span>
                        <span className="text-[11px] text-muted-foreground/70 truncate w-full leading-tight mt-0.5">
                          {record.name}
                        </span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })
          )}
        </SidebarMenu>

        {more && <div ref={sentinelRef} className="h-4" />}

        {loading && (
          <div className="py-3 flex items-center justify-center gap-2">
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:0ms]" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:150ms]" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        {!more && records.length > 0 && (
          <div className="py-3 text-center">
            <span className="text-[10px] text-muted-foreground/30">— {records.length} —</span>
          </div>
        )}

      </ScrollArea>
    </div>
  );
}
