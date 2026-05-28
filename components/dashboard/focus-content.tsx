"use client";

import { useState, useMemo } from "react";
import { Record } from "@/app/generated/prisma/client";
import { useRecordsList } from "@/hooks/use-records-list";
import { RecordDetailSheet } from "./record-detail-sheet";
import { RecordUsersPopover } from "@/components/records/record-users-popover";
import { Card } from "@/components/ui/card";
import { TracingBadge } from "@/components/records/tracing-badge";
import { Badge } from "@/components/ui/badge";
import { Star, SlidersHorizontal, ChevronDown, ChevronRight, X, Search, AlertTriangle, FolderOpen } from "lucide-react";
import { PRIORITY_OPTIONS } from "@/app/constants";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { formatOrder } from "@/lib/record-number";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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

const PRIORITY_TIER: { [k: string]: number } = {
  URGENTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3, NULA: 4, INACTIVO: 5,
};

interface Stats {
  total: number;
  urgente: number;
  alta: number;
  camara: number;
  favoritos: number;
  enCobro: number;
  staleUrgente: number;
}

type AssigneesMap = {
  [recordId: number]: { id: number; name: string | null; email: string; image: string | null }[];
};

interface FocusContentProps {
  initialRecords: Record[];
  lastId: number | null;
  hasMore: boolean;
  stats: Stats;
  initialMine: boolean;
  initialFavoritesOnly: boolean;
  initialAssigneesMap?: AssigneesMap;
}


function RecordRow({
  record,
  isSelected,
  onClick,
  assignees,
  hidePriorityBadge = false,
}: {
  record: Record;
  isSelected: boolean;
  onClick: () => void;
  assignees?: AssigneesMap[number];
  hidePriorityBadge?: boolean;
}) {
  const priority = PRIORITY_OPTIONS[record.priority];
  const updatedAt = new Date(record.updatedAt);

  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 px-4 py-2.5 border-l-[3px] transition-colors cursor-pointer",
        isSelected ? "bg-accent/80" : "hover:bg-accent/40"
      )}
      style={{ borderLeftColor: priority?.color ?? "transparent" }}
    >
      <span className="text-sm font-semibold shrink-0 w-28 font-mono truncate">
        {formatOrder(record.order)}
      </span>
      <span className="shrink-0">
        <TracingBadge tracing={record.tracing} size="sm" />
      </span>
      <span className="flex-1 text-sm truncate min-w-0">{record.name}</span>

      {!hidePriorityBadge && priority && record.priority !== "NULA" && record.priority !== "INACTIVO" && (
        <Badge
          className="shrink-0 text-[10px] h-5 px-1.5"
          style={{ backgroundColor: priority.color, color: "#1a1a1a" }}
        >
          {priority.label}
        </Badge>
      )}

      <RecordUsersPopover
        recordId={record.id}
        size="sm"
        initialAssignees={assignees}
      />

      <Star
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-colors",
          record.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
        )}
      />

      <span className="text-[11px] text-muted-foreground shrink-0 w-14 text-right tabular-nums">
        {relativeTime(updatedAt)}
      </span>
    </div>
  );
}

function TriageSectionHeader({
  label,
  tooltip,
  count,
  staleCount,
  color,
  open,
  onToggle,
  muted = false,
}: {
  label: string;
  tooltip?: string;
  count: number;
  staleCount?: number;
  color: string;
  open: boolean;
  onToggle: () => void;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/10 transition-colors"
    >
      <div
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: muted ? "var(--muted-foreground)" : color, opacity: muted ? 0.4 : 0.9 }}
      />
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn("text-[10px] font-bold uppercase tracking-widest shrink-0", muted && "text-muted-foreground/50")}
              style={muted ? undefined : { color }}
            >
              {label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        <span
          className={cn("text-[10px] font-bold uppercase tracking-widest shrink-0", muted && "text-muted-foreground/50")}
          style={muted ? undefined : { color }}
        >
          {label}
        </span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0">{count}</span>
        </TooltipTrigger>
        <TooltipContent side="right">Total en esta sección</TooltipContent>
      </Tooltip>
      {staleCount !== undefined && staleCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-red-400 bg-red-500/10 px-1.5 rounded shrink-0 leading-[18px]">
              <AlertTriangle className="h-2 w-2" />
              {staleCount}
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">
            {staleCount} urgente{staleCount !== 1 ? "s" : ""} sin actividad en más de 7 días
          </TooltipContent>
        </Tooltip>
      )}
      <div className="flex-1 h-px bg-border/40 mx-1" />
      {open ? (
        <ChevronDown className="h-3 w-3 text-muted-foreground/30 shrink-0" />
      ) : (
        <ChevronRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
      )}
    </button>
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
  const [collapsed, setCollapsed] = useState({
    urgente: false,
    alta: false,
    proceso: stats.urgente > 0 || stats.alta > 0 || stats.camara > 0,
  });

  const toggleSection = (key: keyof typeof collapsed) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const {
    filteredRecords,
    displayRecords,
    loading,
    more,
    mine,
    favoritesOnly,
    apartadoOnly,
    tracingFilter,
    minPriority,
    pinnedQuery,
    commandLoading,
    searchInputRef,
    setSearch,
    clearPinnedSearch,
    toggleTracingKey,
    updateTracingFilter,
    updateMinPriority,
    updateMine,
    updateFavoritesOnly,
    updateApartadoOnly,
    scrollRef,
    sentinelRef,
  } = useRecordsList({
    initialRecords,
    lastId,
    hasMore,
    initialMine,
    initialFavoritesOnly,
    priorityPreload: true,
  });

  const activeFilterCount =
    tracingFilter.length + (minPriority ? 1 : 0) + (mine ? 1 : 0) + (favoritesOnly ? 1 : 0) + (apartadoOnly ? 1 : 0);

  const sortedRecords = useMemo(
    () =>
      [...displayRecords].sort((a, b) => {
        const ta = PRIORITY_TIER[a.priority] ?? 4;
        const tb = PRIORITY_TIER[b.priority] ?? 4;
        if (ta !== tb) return ta - tb;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); // más reciente primero
      }),
    [displayRecords]
  );

  const urgentesRecs = useMemo(
    () => sortedRecords.filter((r) => r.priority === "URGENTE"),
    [sortedRecords]
  );
  const altasRecs = useMemo(
    () => sortedRecords.filter(
      (r) => r.priority === "ALTA" || (r.tracing === "TRAMITE_EN_CAMARA" && r.priority !== "URGENTE")
    ),
    [sortedRecords]
  );
  const procesoRecs = useMemo(
    () => sortedRecords.filter(
      (r) => r.priority !== "URGENTE" && r.priority !== "ALTA" && r.tracing !== "TRAMITE_EN_CAMARA"
    ),
    [sortedRecords]
  );

  // Server-computed counts — stable, never jump on scroll
  const procesoTotal = Math.max(0, stats.total - stats.urgente - stats.alta - stats.camara);

  return (
    <>
      <Card
        id="tour-focus-records"
        className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg p-0 gap-0"
      >
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
              placeholder="Buscar expedientes..."
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

        {/* Filters panel */}
        {filtersOpen && (
          <div className="border-y border-border/40 bg-muted/20 px-4 py-3 space-y-3 overflow-y-auto max-h-[40vh] shrink-0">
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
                          ? { backgroundColor: opt.color, color: "var(--tracing-text)", borderColor: opt.color }
                          : { borderColor: opt.color, color: opt.color }
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
                <button
                  onClick={() => updateApartadoOnly(!apartadoOnly)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium border border-sky-400/60 text-sky-500 transition-all flex items-center gap-0.5",
                    apartadoOnly ? "opacity-100 bg-sky-400/15" : "opacity-55 hover:opacity-75"
                  )}
                >
                  <FolderOpen className="h-2.5 w-2.5" />
                  Con apartado
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Context chips */}
        <div
          id="tour-focus-stats"
          className="flex items-center gap-2 px-4 py-1 border-b border-border/30 shrink-0 bg-muted/10"
        >
          <span className="text-[10px] text-muted-foreground/60">{stats.total} expedientes</span>
          {stats.urgente > 0 && (
            <>
              <span className="text-muted-foreground/25 text-[10px]">·</span>
              <span className="text-[10px] font-medium" style={{ color: PRIORITY_OPTIONS.URGENTE.color }}>{stats.urgente} urgentes</span>
            </>
          )}
          {stats.alta > 0 && (
            <>
              <span className="text-muted-foreground/25 text-[10px]">·</span>
              <span className="text-[10px]" style={{ color: PRIORITY_OPTIONS.ALTA.color }}>{stats.alta} alta</span>
            </>
          )}
          {stats.enCobro > 0 && (
            <>
              <span className="text-muted-foreground/25 text-[10px]">·</span>
              <span className="text-[10px]" style={{ color: TRACING_OPTIONS.COBRADO.color }}>{stats.enCobro} en cobro</span>
            </>
          )}
          {stats.staleUrgente > 0 && (
            <>
              <span className="text-muted-foreground/25 text-[10px]">·</span>
              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: PRIORITY_OPTIONS.URGENTE.color }}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {stats.staleUrgente} inactivos
              </span>
            </>
          )}
        </div>

        {/* Triage list */}
        <div className="flex-1 min-h-0 overflow-y-auto" ref={scrollRef}>
          {displayRecords.length === 0 && !loading ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No hay expedientes</p>
            </div>
          ) : (
            <>
              {/* INMEDIATO — urgente */}
              {urgentesRecs.length > 0 && (
                <div>
                  <TriageSectionHeader
                    label="Inmediato"
                    tooltip="Expedientes que requieren acción inmediata"
                    count={stats.urgente}
                    staleCount={stats.staleUrgente}
                    color={PRIORITY_OPTIONS.URGENTE.color}
                    open={!collapsed.urgente}
                    onToggle={() => toggleSection("urgente")}
                  />
                  {!collapsed.urgente && (
                    <div className="divide-y divide-border/30">
                      {urgentesRecs.map((record) => (
                        <RecordRow
                          key={record.id}
                          record={record}
                          isSelected={selectedRecordId === record.id}
                          onClick={() => setSelectedRecordId(record.id)}
                          assignees={initialAssigneesMap[record.id]}
                          hidePriorityBadge
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SEGUIMIENTO — alta + trámite en cámara */}
              {altasRecs.length > 0 && (
                <div>
                  <TriageSectionHeader
                    label="Seguimiento"
                    tooltip="Expedientes de seguimiento prioritario"
                    count={stats.alta + stats.camara}
                    color={PRIORITY_OPTIONS.ALTA.color}
                    open={!collapsed.alta}
                    onToggle={() => toggleSection("alta")}
                  />
                  {!collapsed.alta && (
                    <div className="divide-y divide-border/30">
                      {altasRecs.map((record) => (
                        <RecordRow
                          key={record.id}
                          record={record}
                          isSelected={selectedRecordId === record.id}
                          onClick={() => setSelectedRecordId(record.id)}
                          assignees={initialAssigneesMap[record.id]}
                          hidePriorityBadge
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* EN PROCESO — resto */}
              {procesoRecs.length > 0 && (
                <div>
                  <TriageSectionHeader
                    label="En proceso"
                    tooltip="Expedientes en curso sin urgencia inmediata"
                    count={procesoTotal}
                    color={PRIORITY_OPTIONS.NULA.color}
                    open={!collapsed.proceso}
                    onToggle={() => toggleSection("proceso")}
                    muted
                  />
                  {!collapsed.proceso && (
                    <div className="divide-y divide-border/30">
                      {procesoRecs.map((record) => (
                        <RecordRow
                          key={record.id}
                          record={record}
                          isSelected={selectedRecordId === record.id}
                          onClick={() => setSelectedRecordId(record.id)}
                          assignees={initialAssigneesMap[record.id]}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {more && <div ref={sentinelRef} className="h-4" />}

          {loading && (
            <div className="py-3 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/40">
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:0ms]" />
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:150ms]" />
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:300ms]" />
            </div>
          )}

          {!more && displayRecords.length > 0 && (
            <div className="py-3 text-center">
              <span className="text-[10px] text-muted-foreground/40">— {displayRecords.length} expedientes —</span>
            </div>
          )}
        </div>
      </Card>

      <RecordDetailSheet
        recordId={selectedRecordId}
        onClose={() => setSelectedRecordId(null)}
      />
    </>
  );
}
