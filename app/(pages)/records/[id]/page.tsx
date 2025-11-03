import prisma from "@/lib/prisma";
import EditableRecordPage from "./editable-record-page";
import { TRACING_OPTIONS } from "@/app/constants";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const record = await prisma.record.findUniqueOrThrow({
    where: {
      id: Number(id),
    },
    include: {
      Note: true,
      Office: {
        include: {
          Court: {
            include: {
              District: true,
            },
          },
        },
      },
    },
  });

  if (!record) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-white/50">No se ha encontrado ese expediente.</p>
      </div>
    );
  }

  return (
    <EditableRecordPage record={record} tracingOptions={TRACING_OPTIONS} />
  );
}
