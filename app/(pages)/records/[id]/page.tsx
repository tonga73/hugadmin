import prisma from "@/lib/prisma";
import EditableRecordPage from "./editable-record-page";
import { TRACING_OPTIONS } from "@/app/constants";
import { getSessionUser } from "@/lib/session";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [record, sessionUser] = await Promise.all([
    prisma.record.findUniqueOrThrow({
      where: { id: Number(id) },
      include: {
        Note: true,
        files: { orderBy: { createdAt: "desc" } },
        Office: { include: { Court: { include: { District: true } } } },
        RecordsAndUser: {
          include: {
            User: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        activity: {
          orderBy: { id: "desc" },
          take: 26,
          include: { user: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    }),
    getSessionUser(),
  ]);

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white/50">No se ha encontrado ese expediente.</p>
      </div>
    );
  }

  const assignees = record.RecordsAndUser.map((r) => r.User);
  const activityHasMore = record.activity.length > 25;
  const activityItems = activityHasMore ? record.activity.slice(0, 25) : record.activity;
  const activityNextCursor = activityHasMore ? activityItems[activityItems.length - 1].id : null;

  return (
    <EditableRecordPage
      record={record}
      tracingOptions={TRACING_OPTIONS}
      assignees={assignees}
      initialActivity={activityItems.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
      initialActivityNextCursor={activityNextCursor}
    />
  );
}
