import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { PRIORITY_OPTIONS } from "@/app/constants/priority";
import Link from "next/link";

interface Props {
  tracingFilter: string[];
}

export async function StageDashboard({ tracingFilter }: Props) {
  const stages = tracingFilter.length > 0 ? tracingFilter : Object.keys(TRACING_OPTIONS);

  const [stageGroupBy, recentRecords] = await Promise.all([
    prisma.record.groupBy({
      by: ["tracing"],
      where: { tracing: { in: stages as any[] } },
      _count: { _all: true },
    }),
    prisma.record.findMany({
      where: { tracing: { in: stages as any[] } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 10,
      select: { id: true, order: true, name: true, tracing: true, priority: true, favorite: true },
    }),
  ]);

  const stageCountMap = Object.fromEntries(
    stageGroupBy.map((r) => [r.tracing, r._count._all])
  );
  const stageCounts = stages.map((tracing) => ({ tracing, count: stageCountMap[tracing] ?? 0 }));
  const totalInStages = stageGroupBy.reduce((sum, r) => sum + r._count._all, 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5">
      {/* Stage counts */}
      <div className={`grid gap-1.5 shrink-0`} style={{ gridTemplateColumns: `repeat(${Math.min(stages.length, 4)}, 1fr)` }}>
        {stageCounts.map(({ tracing, count }) => {
          const opt = TRACING_OPTIONS[tracing];
          return (
            <Card key={tracing}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: opt?.color }} />
                  <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground truncate">
                    {opt?.label ?? tracing}
                  </p>
                </div>
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground">
                  {totalInStages > 0 ? Math.round((count / totalInStages) * 100) : 0}% del total asignado
                </p>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Recent records in those stages */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm">Expedientes en tu etapa</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-1 p-3 pt-0">
          {recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin expedientes en esta etapa</p>
          ) : (
            recentRecords.map((r) => {
              const tracing = TRACING_OPTIONS[r.tracing];
              const priority = PRIORITY_OPTIONS[r.priority];
              return (
                <Link
                  key={r.id}
                  href={`/records/${r.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: tracing?.color }} />
                  <span className="text-xs font-medium text-muted-foreground shrink-0 w-20 truncate">{r.order}</span>
                  <span className="text-xs flex-1 truncate">{r.name}</span>
                  {priority && r.priority !== "NULA" && (
                    <Badge
                      className="h-4 text-[9px] px-1.5 shrink-0"
                      style={{ backgroundColor: priority.color, color: "#1a1a1a" }}
                    >
                      {priority.label}
                    </Badge>
                  )}
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
