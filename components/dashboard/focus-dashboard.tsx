import prisma from "@/lib/prisma";
import { getPrioritiesAboveMin } from "@/lib/user-config";
import { getRecords } from "@/app/actions/getRecords";
import { FocusContent } from "./focus-content";

interface FocusDashboardProps {
  assignedToUserId?: number;
  favoritesOnly: boolean;
  tracingFilter: string[];
  minPriority: string | null;
  initialMine: boolean;
}

export async function FocusDashboard({
  assignedToUserId,
  favoritesOnly,
  tracingFilter,
  minPriority,
  initialMine,
}: FocusDashboardProps) {
  // Build base where clause for stats
  const statsWhere: any = {};
  if (assignedToUserId) statsWhere.RecordsAndUser = { some: { userId: assignedToUserId } };
  if (favoritesOnly) statsWhere.favorite = true;
  if (tracingFilter.length > 0) statsWhere.tracing = { in: tracingFilter };
  if (minPriority) {
    const priorities = getPrioritiesAboveMin(minPriority);
    if (priorities.length > 0) statsWhere.priority = { in: priorities };
  }

  const [initialData, total, urgente, alta, favoritos] = await Promise.all([
    getRecords({
      take: 20,
      explicitFilters: { tracingFilter, minPriority, mine: initialMine, favoritesOnly },
      assignedToUserId,
    }),
    prisma.record.count({ where: statsWhere }),
    prisma.record.count({ where: { ...statsWhere, priority: "URGENTE" } }),
    prisma.record.count({ where: { ...statsWhere, priority: "ALTA" } }),
    prisma.record.count({ where: { ...statsWhere, favorite: true } }),
  ]);

  const records = initialData.records.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));

  const recordIds = records.map((r) => r.id);
  const assigneesRows = recordIds.length > 0
    ? await prisma.recordsAndUser.findMany({
        where: { recordId: { in: recordIds } },
        include: { User: { select: { id: true, name: true, email: true, image: true } } },
      })
    : [];

  const assigneesMap: Record<number, { id: number; name: string | null; email: string; image: string | null }[]> = {};
  for (const row of assigneesRows) {
    if (!assigneesMap[row.recordId]) assigneesMap[row.recordId] = [];
    assigneesMap[row.recordId].push(row.User);
  }

  return (
    <FocusContent
      initialRecords={records}
      lastId={initialData.lastId}
      hasMore={initialData.hasMore}
      stats={{ total, urgente, alta, favoritos }}
      initialMine={initialMine}
      initialFavoritesOnly={favoritesOnly}
      initialAssigneesMap={assigneesMap}
    />
  );
}
