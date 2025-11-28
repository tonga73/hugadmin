import { CircularProgress } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";

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

  return (
    <div className="h-full grid grid-cols-3 grid-rows-2 gap-1.5">
      {/* Sección principal - 2 columnas, 2 filas */}
      <div className="col-span-2 row-span-2 flex flex-col gap-1.5">
        {/* Fila superior - Total y Cobrados */}
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Total Expedientes</CardTitle>
              <CardDescription>
                {activosStat} activos · {inactivoStat} archivados
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full h-full max-h-64 flex flex-col items-center justify-center">
                <CircularProgress
                  size={280}
                  strokeWidth={20}
                  labelClassName="text-muted-foreground text-3xl"
                  progressClassName="stroke-white/50"
                  progress={100}
                />
                <span className="text-xs text-muted-foreground mt-2">
                  {totalStat} expedientes registrados
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Cobrados</CardTitle>
              <CardDescription>
                Expedientes con cobro completado
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full h-full max-h-64 flex flex-col items-center justify-center">
                <CircularProgress
                  size={280}
                  strokeWidth={20}
                  labelClassName="text-teal-400 text-3xl"
                  className="stroke-teal-700/30"
                  progressClassName="stroke-teal-500"
                  progress={getPercentage(cobradoStat)}
                />
                <span className="text-xs text-muted-foreground mt-2">
                  {cobradoStat} de {totalStat} expedientes
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fila inferior - Stats rápidos */}
        <div className="grid grid-cols-3 gap-1.5">
          <Card className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Pericia Realizada</p>
              <p className="text-[10px] text-muted-foreground">
                {periciaRealizadaStat} expedientes
              </p>
            </div>
            <CircularProgress
              size={80}
              className="stroke-indigo-700/30"
              progressClassName="stroke-indigo-500"
              labelClassName="text-sm"
              progress={getPercentage(periciaRealizadaStat)}
            />
          </Card>
          <Card className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Archivados</p>
              <p className="text-[10px] text-muted-foreground">
                {inactivoStat} expedientes
              </p>
            </div>
            <CircularProgress
              size={80}
              className="stroke-gray-700/30"
              progressClassName="stroke-gray-500"
              labelClassName="text-sm"
              progress={getPercentage(inactivoStat)}
            />
          </Card>
          <Card className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Destacados</p>
              <p className="text-[10px] text-muted-foreground">
                {destacadoStat} expedientes
              </p>
            </div>
            <CircularProgress
              size={80}
              className="stroke-emerald-700/30"
              progressClassName="stroke-emerald-400"
              labelClassName="text-sm"
              progress={getPercentage(destacadoStat)}
            />
          </Card>
        </div>
      </div>

      {/* Columna derecha - Prioridad */}
      <div className="space-y-1.5 flex flex-col">
        <p className="uppercase text-xs font-medium text-muted-foreground px-1.5 tracking-wider">
          Por Prioridad
        </p>
        <div className="flex-1 grid grid-rows-3 gap-1.5">
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">
                <p className="text-sm">Media</p>
                <p className="text-[10px] text-muted-foreground">
                  {mediaStat} expedientes
                </p>
              </div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-yellow-700/30"
                  progressClassName="stroke-yellow-500"
                  labelClassName="text-sm"
                  progress={getPercentage(mediaStat)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">
                <p className="text-sm">Alta</p>
                <p className="text-[10px] text-muted-foreground">
                  {altaStat} expedientes
                </p>
              </div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-orange-700/30"
                  progressClassName="stroke-orange-500"
                  labelClassName="text-sm"
                  progress={getPercentage(altaStat)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">
                <p className="text-sm">Urgente</p>
                <p className="text-[10px] text-muted-foreground">
                  {urgenteStat} expedientes
                </p>
              </div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-red-700/30"
                  progressClassName="stroke-red-500"
                  labelClassName="text-sm"
                  progress={getPercentage(urgenteStat)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Columna derecha - Estado de cobro */}
      <div className="space-y-1.5 flex flex-col">
        <p className="uppercase text-xs font-medium text-muted-foreground px-1.5 tracking-wider">
          Estado de Cobro
        </p>
        <div className="flex-1 grid grid-rows-3 gap-1.5">
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">
                <p className="text-sm">Sentencia/Convenio</p>
                <p className="text-[10px] text-muted-foreground">
                  {sentenciaStat} expedientes
                </p>
              </div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-slate-700/30"
                  progressClassName="stroke-slate-400"
                  labelClassName="text-sm"
                  progress={getPercentage(sentenciaStat)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">
                <p className="text-sm">Honorarios Regulados</p>
                <p className="text-[10px] text-muted-foreground">
                  {honorariosReguladosStat} expedientes
                </p>
              </div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-violet-700/30"
                  progressClassName="stroke-violet-500"
                  labelClassName="text-sm"
                  progress={getPercentage(honorariosReguladosStat)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">
                <p className="text-sm">En Tratativa</p>
                <p className="text-[10px] text-muted-foreground">
                  {tratativaStat} expedientes
                </p>
              </div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-amber-700/30"
                  progressClassName="stroke-amber-500"
                  labelClassName="text-sm"
                  progress={getPercentage(tratativaStat)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
