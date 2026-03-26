import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { UnassignedFilesClient } from "./unassigned-files-client";

async function UnassignedFilesData() {
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
    <UnassignedFilesClient
      initialFiles={files.map((f) => ({
        ...f,
        createdAt: f.createdAt.toISOString(),
        folderPath: f.folderPath ?? null,
      }))}
      records={records}
    />
  );
}

function UnassignedSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {/* Search + sync bar */}
      <div className="flex items-center gap-2">
        <div className="h-8 flex-1 rounded-lg bg-muted" />
        <div className="h-8 w-32 rounded-lg bg-muted" />
      </div>
      {/* Fake folder rows */}
      <div className="rounded-xl border p-3 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 rounded-md bg-muted" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    </div>
  );
}

export default function UnassignedPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Archivos sin asignar</h1>
        <p className="text-sm text-muted-foreground">Archivos de Drive pendientes de asignación</p>
      </div>

      <Suspense fallback={<UnassignedSkeleton />}>
        <UnassignedFilesData />
      </Suspense>
    </div>
  );
}
