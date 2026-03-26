import prisma from "@/lib/prisma";
import EditableRecordPage from "./editable-record-page";
import { TRACING_OPTIONS } from "@/app/constants";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfig } from "@/lib/user-config";

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
      },
    }),
    getSessionUser(),
  ]);

  const config = sessionUser?.email ? await getUserViewConfig(sessionUser.email) : null;
  const allowedCategories =
    config?.fileCategories && config.fileCategories.length > 0
      ? (config.fileCategories as string[])
      : undefined;

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white/50">No se ha encontrado ese expediente.</p>
      </div>
    );
  }

  return (
    <EditableRecordPage
      record={record}
      tracingOptions={TRACING_OPTIONS}
      allowedFileCategories={allowedCategories}
    />
  );
}
