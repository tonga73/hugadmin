import { CircularProgress, ModeToggle } from "@/components/shared";
import prisma from "@/lib/prisma";

export default async function Home() {
  const [total, destacado, inactivo, urgenteStat] = await Promise.all([
    prisma.record.count(),
    prisma.record.count({ where: { favorite: true } }),
    prisma.record.count({ where: { archive: true } }),
    prisma.record.count({ where: { priority: "URGENTE" } }),
  ]);

  return <div className="grid place-items-center">inicio </div>;
}
