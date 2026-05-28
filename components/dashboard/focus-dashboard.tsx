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
  apartadoOnly?: boolean;
}

export async function FocusDashboard({
  assignedToUserId,
  favoritesOnly,
  tracingFilter,
  minPriority,
  initialMine,
  apartadoOnly = false,
}: FocusDashboardProps) {
  const statsWhere: any = {};
  if (assignedToUserId) statsWhere.RecordsAndUser = { some: { userId: assignedToUserId } };
  if (favoritesOnly) statsWhere.favorite = true;
  if (tracingFilter.length > 0) statsWhere.tracing = { in: tracingFilter };
  if (minPriority) {
    const priorities = getPrioritiesAboveMin(minPriority);
    if (priorities.length > 0) statsWhere.priority = { in: priorities };
  }
  if (apartadoOnly) statsWhere.files = { some: { category: "APARTADO" } };

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  // Pre-fetch urgentes, altas and trámite-en-cámara so sections are always fully populated on first render
  const [urgentRecords, altaRecords, camaraRecords, paginatedData, total, urgente, alta, camara, favoritos, enCobro, staleUrgente] =
    await Promise.all([
      prisma.record.findMany({
        where: { ...statsWhere, priority: "URGENTE" },
        orderBy: { updatedAt: "desc" }, // más reciente primero
        take: 50,
      }),
      prisma.record.findMany({
        where: { ...statsWhere, priority: "ALTA" },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      prisma.record.findMany({
        where: { ...statsWhere, tracing: "TRAMITE_EN_CAMARA", priority: { notIn: ["URGENTE", "ALTA"] } },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      getRecords({
        take: 20,
        explicitFilters: { tracingFilter, minPriority, mine: initialMine, favoritesOnly, apartadoOnly },
        assignedToUserId,
      }),
      prisma.record.count({ where: statsWhere }),
      prisma.record.count({ where: { ...statsWhere, priority: "URGENTE" } }),
      prisma.record.count({ where: { ...statsWhere, priority: "ALTA" } }),
      prisma.record.count({ where: { ...statsWhere, tracing: "TRAMITE_EN_CAMARA", priority: { notIn: ["URGENTE", "ALTA"] } } }),
      prisma.record.count({ where: { ...statsWhere, favorite: true } }),
      prisma.record.count({ where: { ...statsWhere, tracing: { in: ["HONORARIOS_REGULADOS", "EN_TRATATIVA_DE_COBRO"] } } }),
      prisma.record.count({ where: { ...statsWhere, priority: "URGENTE", archive: false, updatedAt: { lt: sevenDaysAgo } } }),
    ]);

  // Merge: urgentes, altas y cámara primero, luego el resto paginado (sin duplicados)
  const priorityIds = new Set([
    ...urgentRecords.map((r) => r.id),
    ...altaRecords.map((r) => r.id),
    ...camaraRecords.map((r) => r.id),
  ]);
  const paginatedOthers = paginatedData.records
    .filter((r) => !priorityIds.has(r.id))
    .map((r) => ({ ...r, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) }));

  const initialRecords = [...urgentRecords, ...altaRecords, ...camaraRecords, ...paginatedOthers];

  const recordIds = initialRecords.map((r) => r.id);
  const assigneesRows =
    recordIds.length > 0
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
      initialRecords={initialRecords}
      lastId={paginatedData.lastId}
      hasMore={paginatedData.hasMore}
      stats={{ total, urgente, alta, camara, favoritos, enCobro, staleUrgente }}
      initialMine={initialMine}
      initialFavoritesOnly={favoritesOnly}
      initialAssigneesMap={assigneesMap}
    />
  );
}
