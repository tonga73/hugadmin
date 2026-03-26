import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { getPrioritiesAboveMin } from "@/lib/user-config";

interface Props {
  tracingFilter: string[];
  favoritesOnly: boolean;
  minPriority: string | null;
}

export async function HybridDashboard({ tracingFilter, favoritesOnly, minPriority }: Props) {
  const userWhere: any = {};
  if (tracingFilter.length > 0) userWhere.tracing = { in: tracingFilter };
  if (favoritesOnly) userWhere.favorite = true;
  if (minPriority) {
    const priorities = getPrioritiesAboveMin(minPriority);
    if (priorities.length > 0) userWhere.priority = { in: priorities };
  }

  const hasUserFilter = Object.keys(userWhere).length > 0;

  const [myTotal, myUrgente, myAlta, allTracingCounts, globalTotal] = await Promise.all([
    hasUserFilter ? prisma.record.count({ where: userWhere }) : prisma.record.count(),
    prisma.record.count({ where: { ...userWhere, priority: "URGENTE" } }),
    prisma.record.count({ where: { ...userWhere, priority: "ALTA" } }),
    Promise.all(
      Object.keys(TRACING_OPTIONS).map((tracing) =>
        prisma.record.count({ where: { tracing: tracing as any } }).then((count) => ({ tracing, count }))
      )
    ),
    prisma.record.count(),
  ]);

  const getPercentage = (value: number) =>
    globalTotal > 0 ? Math.round((value / globalTotal) * 100) : 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5">
      {/* Filtered stats */}
      <div className="grid grid-cols-3 gap-1.5 shrink-0">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Mi vista</p>
            <p className="text-3xl font-bold">{myTotal}</p>
            <p className="text-[10px] text-muted-foreground">de {globalTotal} totales</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Urgentes</p>
            <p className="text-3xl font-bold text-red-400">{myUrgente}</p>
            <p className="text-[10px] text-muted-foreground">en mi vista</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Alta prioridad</p>
            <p className="text-3xl font-bold text-orange-400">{myAlta}</p>
            <p className="text-[10px] text-muted-foreground">en mi vista</p>
          </CardHeader>
        </Card>
      </div>

      {/* Full pipeline compact */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm">Pipeline completo</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto space-y-3">
          {allTracingCounts.map(({ tracing, count }) => {
            const option = TRACING_OPTIONS[tracing];
            const pct = getPercentage(count);
            const isMyStage = tracingFilter.length === 0 || tracingFilter.includes(tracing);
            return (
              <div key={tracing} className={`flex items-center gap-3 ${!isMyStage ? "opacity-40" : ""}`}>
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: option.color }} />
                <span className="text-sm flex-1 min-w-0 truncate">{option.label}</span>
                <span className="text-sm font-medium w-6 text-right shrink-0">{count}</span>
                <div className="w-28 h-1.5 rounded-full bg-muted shrink-0">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: option.color }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{pct}%</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
