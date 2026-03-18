import prisma from "@/lib/prisma";
import { UnassignedFilesClient } from "./unassigned-files-client";

export default async function UnassignedPage() {
  const [files, records] = await Promise.all([
    prisma.recordFile.findMany({
      where: { recordId: null },
      orderBy: { createdAt: "desc" },
    }),
    prisma.record.findMany({
      select: { id: true, order: true, name: true, code: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Archivos sin asignar</h1>
        <p className="text-sm text-muted-foreground">
          {files.length === 0
            ? "No hay archivos pendientes de asignación."
            : `${files.length} archivo${files.length !== 1 ? "s" : ""} pendiente${files.length !== 1 ? "s" : ""} de asignar a un expediente`}
        </p>
      </div>

      <UnassignedFilesClient
        initialFiles={files.map((f) => ({
          ...f,
          createdAt: f.createdAt.toISOString(),
          folderPath: f.folderPath ?? null,
        }))}
        records={records}
      />
    </div>
  );
}
