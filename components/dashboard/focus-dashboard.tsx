import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfig, getPrioritiesAboveMin } from "@/lib/user-config";
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

  const [initialData, total, urgente, alta, favoritos, sessionUser] = await Promise.all([
    getRecords({
      take: 20,
      explicitFilters: { tracingFilter, minPriority, mine: initialMine, favoritesOnly },
      assignedToUserId,
    }),
    prisma.record.count({ where: statsWhere }),
    prisma.record.count({ where: { ...statsWhere, priority: "URGENTE" } }),
    prisma.record.count({ where: { ...statsWhere, priority: "ALTA" } }),
    prisma.record.count({ where: { ...statsWhere, favorite: true } }),
    getSessionUser(),
  ]);

  const config = sessionUser?.email ? await getUserViewConfig(sessionUser.email) : null;
  const allowedFileCategories =
    config?.fileCategories && (config.fileCategories as string[]).length > 0
      ? (config.fileCategories as string[])
      : undefined;

  const records = initialData.records.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));

  return (
    <FocusContent
      initialRecords={records}
      lastId={initialData.lastId}
      hasMore={initialData.hasMore}
      stats={{ total, urgente, alta, favoritos }}
      initialMine={initialMine}
      initialFavoritesOnly={favoritesOnly}
      allowedFileCategories={allowedFileCategories}
    />
  );
}
