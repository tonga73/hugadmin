import { CircularProgress } from "@/components/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { TRACING_OPTIONS } from "@/app/constants/tracing";

export default async function Home() {
  const [
    totalStat,
    destacadoStat,
    inactivoStat,
    // Prioridades
    mediaStat,
    altaStat,
    urgenteStat,
    // Estados de tracing
    aceptaCargoStat,
    actoPericialStat,
    periciaRealizadaStat,
    sentenciaStat,
    honorariosReguladosStat,
    tratativaStat,
    cobradoStat,
  ] = await Promise.all([
    prisma.record.count(),
    prisma.record.count({ where: { favorite: true } }),
    prisma.record.count({ where: { archive: true } }),
    // Prioridades
    prisma.record.count({ where: { priority: "MEDIA" } }),
    prisma.record.count({ where: { priority: "ALTA" } }),
    prisma.record.count({ where: { priority: "URGENTE" } }),
    // Estados de tracing
    prisma.record.count({ where: { tracing: "ACEPTA_CARGO" } }),
    prisma.record.count({ where: { tracing: "ACTO_PERICIAL_REALIZADO" } }),
    prisma.record.count({ where: { tracing: "PERICIA_REALIZADA" } }),
    prisma.record.count({ where: { tracing: "SENTENCIA_O_CONVENIO_DE_PARTES" } }),
    prisma.record.count({ where: { tracing: "HONORARIOS_REGULADOS" } }),
    prisma.record.count({ where: { tracing: "EN_TRATATIVA_DE_COBRO" } }),
    prisma.record.count({ where: { tracing: "COBRADO" } }),
  ]);

  // Helper para calcular porcentaje
  const getPercentage = (value: number) =>
    totalStat > 0 ? Math.round((value / totalStat) * 100) : 0;

  // Expedientes activos (no archivados)
  const activosStat = totalStat - inactivoStat;

  const tracingFlow = [
    { key: "ACEPTA_CARGO", count: aceptaCargoStat },
    { key: "ACTO_PERICIAL_REALIZADO", count: actoPericialStat },
    { key: "PERICIA_REALIZADA", count: periciaRealizadaStat },
    { key: "SENTENCIA_O_CONVENIO_DE_PARTES", count: sentenciaStat },
    { key: "HONORARIOS_REGULADOS", count: honorariosReguladosStat },
    { key: "EN_TRATATIVA_DE_COBRO", count: tratativaStat },
    { key: "COBRADO", count: cobradoStat },
  ];

  return (
    <div className="h-full flex flex-col gap-1.5">
      {/* Fila 1 — 4 stat cards numéricas */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Total</p>
            <p className="text-3xl font-bold">{totalStat}</p>
            <p className="text-[10px] text-muted-foreground">expedientes registrados</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Activos</p>
            <p className="text-3xl font-bold">{activosStat}</p>
            <p className="text-[10px] text-muted-foreground">{inactivoStat} archivados</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Destacados</p>
            <p className="text-3xl font-bold">{destacadoStat}</p>
            <p className="text-[10px] text-muted-foreground">{getPercentage(destacadoStat)}% del total</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Cobrados</p>
            <p className="text-3xl font-bold text-teal-400">{cobradoStat}</p>
            <p className="text-[10px] text-muted-foreground">{getPercentage(cobradoStat)}% completados</p>
          </CardHeader>
        </Card>
      </div>

      {/* Fila 2 — Flujo + Prioridad */}
      <div className="flex-1 grid grid-cols-3 gap-1.5 min-h-0">
        {/* Flujo de expedientes */}
        <Card className="col-span-2 flex flex-col min-h-0">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm">Flujo de expedientes</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-3">
            {tracingFlow.map(({ key, count }) => {
              const option = TRACING_OPTIONS[key];
              const pct = getPercentage(count);
              return (
                <div key={key} className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: option.color }}
                  />
                  <span className="text-sm flex-1 min-w-0 truncate">{option.label}</span>
                  <span className="text-sm font-medium w-6 text-right shrink-0">{count}</span>
                  <div className="w-28 h-1.5 rounded-full bg-muted shrink-0">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: option.color }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Por prioridad */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm">Por prioridad</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-around">
            {[
              { label: "Media", count: mediaStat, className: "stroke-yellow-700/30", progressClassName: "stroke-yellow-500" },
              { label: "Alta", count: altaStat, className: "stroke-orange-700/30", progressClassName: "stroke-orange-500" },
              { label: "Urgente", count: urgenteStat, className: "stroke-red-700/30", progressClassName: "stroke-red-500" },
            ].map(({ label, count, className, progressClassName }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{count} expedientes</p>
                </div>
                <CircularProgress
                  size={87}
                  className={className}
                  progressClassName={progressClassName}
                  labelClassName="text-sm"
                  progress={getPercentage(count)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
