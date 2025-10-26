import { CircularProgress, ModeToggle } from "@/components/shared";
import prisma from "@/lib/prisma";

export default async function Home() {
  const [total, destacado, inactivo, urgenteStat] = await Promise.all([
    prisma.record.count(),
    prisma.record.count({ where: { favorite: true } }),
    prisma.record.count({ where: { archive: true } }),
    prisma.record.count({ where: { priority: "URGENTE" } }),
  ]);

  return (
    <div className="grid grid-cols-2 2xl:grid-cols-6 gap-1.5">
      <CircularProgress
        color="oklch(56.85% 0.1236 237.07)"
        count={total}
        description="Totalidad de expedientes en el sitema"
        title="Total"
        progress={100}
      />
      <CircularProgress
        color="#ef4444"
        count={destacado}
        description="Totalidad de expedientes en el sitema"
        title="Total"
        progress={100}
      />
      <CircularProgress
        color="#f59e0b"
        count={inactivo}
        description="Totalidad de expedientes en el sitema"
        title="Total"
        progress={100}
      />
      <CircularProgress
        color="#10b981"
        count={urgenteStat}
        description="Totalidad de expedientes en el sitema"
        title="Total"
        progress={100}
      />
    </div>
  );
}
