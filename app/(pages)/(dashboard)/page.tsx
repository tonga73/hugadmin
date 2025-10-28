import { CircularProgress, ModeToggle } from "@/components/shared";
import { StatCard } from "@/components/shared/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";

const statSections = {
  main: [
    {
      label: "Pericia Realizada",
      value: "PERICIA_REALIZADA",
      color: "oklch(54.98% 0.0547 246.16)",
    },
    {
      label: "Cobrado",
      value: "COBRADO",
      color: "oklch(55.54% 0.257 284.63)",
    },
    {
      label: "Total",
      value: "TOTAL",
      color: "oklch(56.85% 0.1236 237.07)",
    },
    {
      label: "Inactivo",
      value: "PERICIA_REALIZADA",
      color: "oklch(85.28% 0.196 158.83)",
    },
    {
      label: "Destacado",
      value: "PERICIA_REALIZADA",
      color: "oklch(85.28% 0.196 158.83)",
    },
  ],
};

export default async function Home() {
  const [
    totalStat,
    destacadoStat,
    inactivoStat,
    mediaStat,
    altaStat,
    urgenteStat,
    cobradoStat,
    periciaRealizadaStat,
    sentenciaStat,
    honorariosReguladosStat,
    tratativaStat,
  ] = await Promise.all([
    prisma.record.count(),
    prisma.record.count({ where: { favorite: true } }),
    prisma.record.count({ where: { archive: true } }),
    prisma.record.count({ where: { priority: "MEDIA" } }),
    prisma.record.count({ where: { priority: "ALTA" } }),
    prisma.record.count({ where: { priority: "URGENTE" } }),
    prisma.record.count({ where: { tracing: "COBRADO" } }),
    prisma.record.count({ where: { tracing: "PERICIA_REALIZADA" } }),
    prisma.record.count({
      where: { tracing: "SENTENCIA_O_CONVENIO_DE_PARTES" },
    }),
    prisma.record.count({ where: { tracing: "HONORARIOS_REGULADOS" } }),
    prisma.record.count({ where: { tracing: "EN_TRATATIVA_DE_COBRO" } }),
  ]);

  return (
    <div className="h-full grid grid-cols-3 grid-rows-2 gap-1.5">
      <div className="col-span-2 row-span-2 flex flex-col gap-1.5">
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Total</CardTitle>
              <CardDescription>
                Total de expedientes en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full h-full max-h-64 flex items-center justify-center">
                <CircularProgress
                  size={300}
                  strokeWidth={20}
                  labelClassName="text-white/50 text-3xl"
                  progressClassName="stroke-white/50"
                  progress={100}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Cobrados</CardTitle>
              <CardDescription>Total de expedientes cobrados</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="w-full h-full max-h-64 flex items-center justify-center">
                <CircularProgress
                  size={300}
                  strokeWidth={20}
                  labelClassName="text-white/50 text-3xl"
                  className="stroke-teal-700/50"
                  progressClassName="stroke-teal-700"
                  progress={Math.round((cobradoStat / totalStat) * 100)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Card className="h-full flex items-center gap-4">
            <div className="flex-1">Pericia Realizada</div>
            <div className="w-24 h-24">
              <CircularProgress
                className="stroke-indigo-700/50"
                progressClassName="stroke-indigo-700"
                progress={Math.round((periciaRealizadaStat / totalStat) * 100)}
              />
            </div>
          </Card>
          <Card className="h-full flex items-center gap-4">
            <div className="flex-1">Inactivos</div>
            <div className="w-24 h-24">
              <CircularProgress
                className="stroke-gray-700/50"
                progressClassName="stroke-gray-700"
                progress={Math.round((inactivoStat / totalStat) * 100)}
              />
            </div>
          </Card>
          <Card className="h-full flex items-center gap-4">
            <div className="flex-1">Destacados</div>
            <div className="w-24 h-24">
              <CircularProgress
                className="stroke-[#07F49E]/50"
                progressClassName="stroke-[#07F49E]"
                progress={Math.round((destacadoStat / totalStat) * 100)}
              />
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-1.5 flex flex-col">
        <p className="uppercase font-light text-white/50 px-1.5">Prioridad</p>
        <div className="flex-1 grid grid-rows-3 gap-1.5">
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">Media</div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-yellow-700/50"
                  progressClassName="stroke-yellow-700"
                  labelClassName="text-sm"
                  progress={Math.round((mediaStat / totalStat) * 100)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">Alta</div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-orange-700/50"
                  progressClassName="stroke-orange-700"
                  labelClassName="text-sm"
                  progress={Math.round((altaStat / totalStat) * 100)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">Urgente</div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-red-700/50"
                  progressClassName="stroke-red-700"
                  labelClassName="text-sm"
                  progress={Math.round((urgenteStat / totalStat) * 100)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-1.5 flex flex-col">
        <p className="uppercase font-light text-white/50 px-1.5">
          Estado Pericial
        </p>
        <div className="flex-1 grid grid-rows-3 gap-1.5">
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">Sentencia o convenio de partes</div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-slate-700/50"
                  progressClassName="stroke-slate-700"
                  labelClassName="text-sm"
                  progress={Math.round((sentenciaStat / totalStat) * 100)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">Pericia Realizada</div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-amber-700/50"
                  progressClassName="stroke-amber-700"
                  labelClassName="text-sm"
                  progress={Math.round(
                    (periciaRealizadaStat / totalStat) * 100
                  )}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="flex flex-row items-center gap-4 py-0">
            <CardContent className="w-full flex flex-row items-center gap-4 py-0">
              <div className="flex-1">En tratativa de cobro</div>
              <div className="flex-0">
                <CircularProgress
                  size={87}
                  className="stroke-rose-700/50"
                  progressClassName="stroke-rose-700"
                  labelClassName="text-sm"
                  progress={Math.round((urgenteStat / totalStat) * 100)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
