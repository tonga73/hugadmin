import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { PRIORITY_OPTIONS } from "@/app/constants/priority";
import { OverviewFilters } from "./overview-filters";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { AttentionBadges } from "./attention-badges";
import { formatOrder } from "@/lib/record-number";

interface OverviewDashboardProps {
  assignedToUserId?: number;
  favoritesOnly?: boolean;
  initialMine?: boolean;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}m`;
}

function formatActivityLabel(action: string, field?: string | null, newValue?: string | null): string {
  if (action === "field_updated") {
    if (field === "tracing") return TRACING_OPTIONS[newValue ?? ""]?.label ?? newValue ?? action;
    if (field === "priority") return `Prioridad → ${PRIORITY_OPTIONS[newValue ?? ""]?.label ?? newValue}`;
    if (field === "name") return "Nombre actualizado";
    if (field === "favorite") return newValue === "true" ? "Marcado destacado" : "Destacado removido";
    if (field === "archive") return newValue === "true" ? "Archivado" : "Desarchivado";
    return "Campo actualizado";
  }
  if (action === "user_assigned") return "Usuario asignado";
  if (action === "user_unassigned") return "Usuario desasignado";
  return action;
}

export async function OverviewDashboard({ assignedToUserId, favoritesOnly, initialMine = false }: OverviewDashboardProps) {
  const baseWhere: any = {};
  if (assignedToUserId) baseWhere.RecordsAndUser = { some: { userId: assignedToUserId } };
  if (favoritesOnly) baseWhere.favorite = true;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [total, byPriority, byTracing, [archivedCount, staleUrgenteCount, billingCount], recentActivity] =
    await Promise.all([
      prisma.record.count({ where: baseWhere }),
      prisma.record.groupBy({ by: ["priority"], _count: { _all: true }, where: baseWhere }),
      prisma.record.groupBy({ by: ["tracing"], _count: { _all: true }, where: baseWhere }),
      Promise.all([
        prisma.record.count({ where: { ...baseWhere, archive: true } }),
        prisma.record.count({
          where: { ...baseWhere, priority: "URGENTE", archive: false, updatedAt: { lt: sevenDaysAgo } },
        }),
        prisma.record.count({
          where: { ...baseWhere, tracing: { in: ["HONORARIOS_REGULADOS", "EN_TRATATIVA_DE_COBRO"] } },
        }),
      ]),
      prisma.recordActivity.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          record: { select: { id: true, order: true } },
          user: { select: { id: true, name: true, image: true } },
        },
      }),
    ]);

  const getPriorityCount = (p: string) => byPriority.find((r) => r.priority === p)?._count._all ?? 0;
  const getTracingCount = (t: string) => byTracing.find((r) => r.tracing === t)?._count._all ?? 0;
  const pct = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

  const urgenteStat = getPriorityCount("URGENTE");
  const altaStat = getPriorityCount("ALTA");
  const cobradoStat = getTracingCount("COBRADO");
  const activosStat = total - archivedCount;
  const attentionCount = urgenteStat + altaStat;

  const tracingFlow = [
    { key: "ACEPTA_CARGO" },
    { key: "ACTO_PERICIAL_REALIZADO" },
    { key: "PERICIA_REALIZADA" },
    { key: "SENTENCIA_O_CONVENIO_DE_PARTES" },
    { key: "HONORARIOS_REGULADOS" },
    { key: "EN_TRATATIVA_DE_COBRO" },
    { key: "COBRADO" },
  ].map(({ key }) => ({ key, count: getTracingCount(key) }));

  const priorityDist = [
    { key: "URGENTE", label: "Urgente", count: urgenteStat, stale: staleUrgenteCount },
    { key: "ALTA",    label: "Alta",    count: altaStat,    stale: 0 },
    { key: "MEDIA",   label: "Media",   count: getPriorityCount("MEDIA"), stale: 0 },
    { key: "BAJA",    label: "Baja",    count: getPriorityCount("BAJA"),  stale: 0 },
    { key: "NULA",    label: "Sin pr.", count: getPriorityCount("NULA"),  stale: 0 },
  ].map((p) => ({ ...p, color: PRIORITY_OPTIONS[p.key].color }));

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-sm font-medium">Expedientes</span>
        <OverviewFilters mine={initialMine} favoritesOnly={favoritesOnly ?? false} />
      </div>

      {/* KPI tiles */}
      <div className="shrink-0 rounded-lg overflow-hidden border bg-border grid grid-cols-2 sm:grid-cols-4 gap-px">
        <div className="bg-card px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-wider font-medium text-muted-foreground">Activos</p>
          <p className="text-2xl font-bold tabular-nums leading-tight">{activosStat}</p>
          <p className="text-[10px] text-muted-foreground">{archivedCount} archivados</p>
        </div>

        <div className={cn("bg-card px-3 py-2.5", attentionCount > 0 && "bg-red-500/5")}>
          <div className="flex items-center gap-1">
            {staleUrgenteCount > 0 && <AlertTriangle className="h-2.5 w-2.5 text-red-400 shrink-0" />}
            <p className="text-[9px] uppercase tracking-wider font-medium text-muted-foreground">Atención</p>
          </div>
          <p className={cn("text-2xl font-bold tabular-nums leading-tight", attentionCount > 0 ? "text-red-400" : "text-muted-foreground/40")}>
            {attentionCount}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">
            <AttentionBadges
              urgenteStat={urgenteStat}
              altaStat={altaStat}
              staleUrgenteCount={staleUrgenteCount}
              attentionCount={attentionCount}
            />
          </p>
        </div>

        <div className="bg-card px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-wider font-medium text-muted-foreground">En cobro</p>
          <p className="text-2xl font-bold tabular-nums leading-tight text-violet-400">{billingCount}</p>
          <p className="text-[10px] text-muted-foreground">honorarios + tratativa</p>
        </div>

        <div className="bg-card px-3 py-2.5">
          <p className="text-[9px] uppercase tracking-wider font-medium text-muted-foreground">Cobrados</p>
          <p className="text-2xl font-bold tabular-nums leading-tight text-teal-400">{cobradoStat}</p>
          <p className="text-[10px] text-muted-foreground">{pct(cobradoStat)}% del total</p>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-1.5 min-h-0">

        {/* Pipeline — 2/3 */}
        <Card className="md:col-span-2 flex flex-col min-h-0">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm">Flujo de expedientes</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto flex flex-col gap-4">
            {/* Proportional stacked bar */}
            {total > 0 && (
              <div className="flex h-3 rounded-full overflow-hidden gap-px">
                {tracingFlow.filter(({ count }) => count > 0).map(({ key, count }) => {
                  const opt = TRACING_OPTIONS[key];
                  return (
                    <div
                      key={key}
                      style={{ width: `${pct(count)}%`, minWidth: "2px", background: opt.color }}
                      title={`${opt.label}: ${count} (${pct(count)}%)`}
                    />
                  );
                })}
              </div>
            )}

            {/* Stage rows */}
            <div className="space-y-3">
              {tracingFlow.map(({ key, count }) => {
                const opt = TRACING_OPTIONS[key];
                const p = pct(count);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: opt.color }} />
                    <span className="text-sm flex-1 min-w-0 truncate text-foreground/80">{opt.label}</span>
                    <span className="text-sm font-semibold tabular-nums w-7 text-right shrink-0">{count}</span>
                    <div className="w-32 h-1.5 rounded-full bg-muted shrink-0">
                      <div className="h-full rounded-full" style={{ width: `${p}%`, background: opt.color }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 w-7 text-right shrink-0 tabular-nums">{p}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right panel — 1/3: priority distribution + activity */}
        <Card className="flex flex-col min-h-0 overflow-hidden p-0 gap-0">

          {/* Priority distribution */}
          <div className="px-4 pt-3.5 pb-3 shrink-0">
            <p className="text-[9px] uppercase tracking-wider font-medium text-muted-foreground mb-3">
              Distribución por prioridad
            </p>
            <div className="space-y-2">
              {priorityDist.map(({ key, label, color, count, stale }) => {
                const p = pct(count);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[11px] text-muted-foreground/80 w-14 shrink-0">{label}</span>
                    <span className="text-[11px] font-semibold tabular-nums w-5 text-right shrink-0">{count}</span>
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: color }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground/40 w-6 text-right shrink-0 tabular-nums">{p}%</span>
                    {stale > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] text-red-400/80 shrink-0">
                        <AlertTriangle className="h-2 w-2" />
                        {stale}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-border/40 shrink-0" />

          {/* Activity feed */}
          <div className="flex-1 min-h-0 overflow-auto px-4 py-3 flex flex-col">
            <p className="text-[9px] uppercase tracking-wider font-medium text-muted-foreground mb-2.5 shrink-0">
              Actividad reciente
            </p>
            {recentActivity.length > 0 ? (
              <div className="flex-1 divide-y divide-border/25">
                {recentActivity.map((act) => (
                  <div key={act.id} className="flex items-center gap-2 py-1.5">
                    <div className="h-4 w-4 rounded-full bg-muted shrink-0 overflow-hidden flex items-center justify-center text-[7px] font-semibold text-muted-foreground uppercase">
                      {act.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={act.user.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        act.user?.name?.[0] ?? "?"
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-medium shrink-0 text-foreground/70 w-16 truncate">
                      {act.record ? formatOrder(act.record.order) : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate flex-1 min-w-0">
                      {formatActivityLabel(act.action, act.field, act.newValue)}
                    </span>
                    <span className="text-[9px] text-muted-foreground/35 shrink-0 tabular-nums">
                      {relativeTime(act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground/40 text-center py-6">Sin actividad registrada</p>
            )}
          </div>

        </Card>
      </div>
    </div>
  );
}
