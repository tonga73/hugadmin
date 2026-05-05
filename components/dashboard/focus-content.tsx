"use client";

import { useState } from "react";
import { Record } from "@/app/generated/prisma/client";
import { useRecordsList } from "@/hooks/use-records-list";
import { RecordDetailSheet } from "./record-detail-sheet";
import { RecordUsersPopover } from "@/components/records/record-users-popover";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TracingBadge } from "@/components/records/tracing-badge";
import { Badge } from "@/components/ui/badge";
import { Star, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { PRIORITY_OPTIONS } from "@/app/constants";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { formatOrder } from "@/lib/record-number";
import { cn } from "@/lib/utils";
import { CommandSearch } from "@/components/records/command-search";
function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  if (days < 365) return `${Math.floor(days / 30)}m`;
  return `${Math.floor(days / 365)}a`;
}

interface Stats {
  total: number;
  urgente: number;
  alta: number;
  favoritos: number;
}

type AssigneesMap = { [recordId: number]: { id: number; name: string | null; email: string; image: string | null }[] };

interface FocusContentProps {
  initialRecords: Record[];
  lastId: number | null;
  hasMore: boolean;
  stats: Stats;
  initialMine: boolean;
  initialFavoritesOnly: boolean;
  initialAssigneesMap?: AssigneesMap;
}

function RecordRowSkeleton() {
  return (
    <div className="px-4 py-3 border-l-[3px] border-muted-foreground/20 animate-pulse flex items-center gap-3">
      <Skeleton className="h-5 w-24 shrink-0" />
      <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
}

export function FocusContent({
  initialRecords,
  lastId,
  hasMore,
  stats,
  initialMine,
  initialFavoritesOnly,
  initialAssigneesMap = {},
}: FocusContentProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    filteredRecords,
    loading,
    more,
    mine,
    favoritesOnly,
    tracingFilter,
    minPriority,
    pinnedQuery,
    commandOpen,
    commandQuery,
    commandLoading,
    commandResults,
    commandHasMore,
    commandSelectedIndex,
    commandItemsRef,
    setCommandQuery,
    setCommandSelectedIndex,
    handleCommandSelect,
    handleCommandClose,
    loadMoreCommandResults,
    clearPinnedSearch,
    toggleTracingKey,
    updateTracingFilter,
    updateMinPriority,
    updateMine,
    updateFavoritesOnly,
    scrollRef,
    sentinelRef,
  } = useRecordsList({
    initialRecords,
    lastId,
    hasMore,
    initialMine,
    initialFavoritesOnly,
  });

  const activeFilterCount =
    tracingFilter.length + (minPriority ? 1 : 0) + (mine ? 1 : 0) + (favoritesOnly ? 1 : 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5">
      {/* Stats row */}
      <div id="tour-focus-stats" className="grid grid-cols-4 gap-1.5 shrink-0">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Total</p>
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">expedientes</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Urgentes</p>
            <p className="text-3xl font-bold text-red-400">{stats.urgente}</p>
            <p className="text-[10px] text-muted-foreground">atención inmediata</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Alta prioridad</p>
            <p className="text-3xl font-bold text-orange-400">{stats.alta}</p>
            <p className="text-[10px] text-muted-foreground">a resolver pronto</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Destacados</p>
            </div>
            <p className="text-3xl font-bold">{stats.favoritos}</p>
            <p className="text-[10px] text-muted-foreground">marcados</p>
          </CardHeader>
        </Card>
      </div>

      {/* Records list */}
      <Card id="tour-focus-records" className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Search */}
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
        {/* Header with filter toggle */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left shrink-0",
            !filtersOpen && "border-b border-border/40",
            filtersOpen ? "bg-muted/40" : "hover:bg-muted/30"
          )}
        >
          <span className="text-sm font-medium">Expedientes</span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <SlidersHorizontal className="h-3 w-3" />
              Filtros
            </span>
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[9px] font-bold rounded-full px-1.5 leading-4">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", filtersOpen && "rotate-180")} />
          </div>
        </button>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="border-b border-border/40 bg-muted/20 px-4 py-3 space-y-3 shrink-0">
            {/* Estado */}
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
                        active ? "opacity-100" : "opacity-80 hover:opacity-100"
                      )}
                      style={
                        active
                          ? { backgroundColor: opt.color, color: opt.textColor, borderColor: opt.color }
                          : { borderColor: opt.color, color: opt.color }
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

            {/* Mis expedientes / Destacados */}
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
        <div className="flex-1 min-h-0 overflow-y-auto" ref={scrollRef}>
          <div className="divide-y divide-border/40">
            {filteredRecords.length === 0 && !loading ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No hay expedientes</p>
              </div>
            ) : (
              filteredRecords.map((record) => {
                const priority = PRIORITY_OPTIONS[record.priority];
                const isSelected = selectedRecordId === record.id;
                return (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecordId(record.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-3 px-4 py-3 border-l-[3px] transition-colors cursor-pointer",
                      isSelected ? "bg-accent/80" : "hover:bg-accent/40"
                    )}
                    style={{ borderLeftColor: priority?.color ?? "transparent" }}
                  >
                    {/* Order */}
                    <span className="text-sm font-semibold shrink-0 w-28 font-mono truncate">
                      {formatOrder(record.order)}
                    </span>

                    {/* Tracing */}
                    <span className="shrink-0">
                      <TracingBadge tracing={record.tracing} size="sm" />
                    </span>

                    {/* Name */}
                    <span className="flex-1 text-sm truncate min-w-0">{record.name}</span>

                    {/* Priority badge */}
                    {priority && record.priority !== "NULA" && (
                      <Badge
                        className="shrink-0 text-[10px] h-5 px-1.5"
                        style={{ backgroundColor: priority.color, color: "#1a1a1a" }}
                      >
                        {priority.label}
                      </Badge>
                    )}

                    {/* Assignees */}
                    <RecordUsersPopover
                      recordId={record.id}
                      size="sm"
                      initialAssignees={initialAssigneesMap[record.id]}
                    />

                    {/* Favorite star */}
                    <Star
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        record.favorite
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/25"
                      )}
                    />

                    {/* Date */}
                    <span className="text-[11px] text-muted-foreground shrink-0 w-16 text-right">
                      {relativeTime(new Date(record.updatedAt))}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Sentinel for infinite scroll */}
          {more && <div ref={sentinelRef} className="h-4" />}

          {/* Loading */}
          {loading && (
            <div className="divide-y divide-border/40">
              <RecordRowSkeleton />
              <RecordRowSkeleton />
              <RecordRowSkeleton />
            </div>
          )}

          {!more && filteredRecords.length > 0 && (
            <div className="py-3 text-center">
              <span className="text-[10px] text-muted-foreground/50">— {filteredRecords.length} expedientes —</span>
            </div>
          )}
        </div>
      </Card>

      {/* Record detail sheet */}
      <RecordDetailSheet
        recordId={selectedRecordId}
        onClose={() => setSelectedRecordId(null)}
      />
    </div>
  );
}
