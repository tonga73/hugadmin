import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PeritoContent } from "@/components/dashboard/perito-content";

export default async function PeritoPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true },
  });
  if (!dbUser) redirect("/login");

  const records = await prisma.record.findMany({
    where: {
      RecordsAndUser: { some: { userId: dbUser.id } },
      archive: false,
    },
    orderBy: [{ apartadoListo: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      order: true,
      name: true,
      tracing: true,
      priority: true,
      apartadoListo: true,
      updatedAt: true,
    },
  });

  return (
    <PeritoContent
      records={records.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }))}
    />
  );
}
