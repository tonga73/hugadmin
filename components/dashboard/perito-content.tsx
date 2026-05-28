"use client";

import { useState, useEffect } from "react";
import { RecordDetailSheet } from "./record-detail-sheet";
import { TracingBadge } from "@/components/records/tracing-badge";
import { formatOrder } from "@/lib/record-number";
import { PRIORITY_OPTIONS } from "@/app/constants/priority";
import { CheckCircle2, FileText, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeritoRecord {
  id: number;
  order: string;
  name: string;
  tracing: string;
  priority: string;
  apartadoListo: boolean;
  updatedAt: Date | string;
}

function relativeTime(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "hoy";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}sem`;
  return `${Math.floor(days / 30)}m`;
}

function RecordRow({
  record,
  onClick,
}: {
  record: PeritoRecord;
  onClick: () => void;
}) {
  const priority = PRIORITY_OPTIONS[record.priority];
  const showPriority = record.priority !== "NULA" && record.priority !== "INACTIVO";

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors group"
    >
      {/* Priority stripe */}
      <div
        className="w-0.5 self-stretch rounded-full shrink-0"
        style={{ backgroundColor: showPriority ? priority.color : "transparent" }}
      />

      {/* Order */}
      <span className="font-mono text-[11px] font-semibold text-muted-foreground/60 shrink-0 w-20 truncate">
        {formatOrder(record.order)}
      </span>

      {/* Name */}
      <span className="flex-1 text-sm truncate min-w-0">{record.name}</span>

      {/* Badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {record.apartadoListo && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
            <CheckCircle2 className="h-2.5 w-2.5" />
            listo
          </span>
        )}
        <TracingBadge tracing={record.tracing as any} size="sm" />
      </div>

      {/* Date */}
      <span className="text-[10px] text-muted-foreground/35 tabular-nums shrink-0 w-8 text-right">
        {relativeTime(record.updatedAt)}
      </span>
    </button>
  );
}

export function PeritoContent({ records: initialRecords }: { records: PeritoRecord[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [records, setRecords] = useState<PeritoRecord[]>(initialRecords);

  useEffect(() => {
    const handler = (e: Event) => {
      const updated = (e as CustomEvent).detail;
      if (!updated?.id) return;
      setRecords((prev) =>
        prev.map((r) =>
          r.id === updated.id
            ? {
                ...r,
                tracing: updated.tracing ?? r.tracing,
                priority: updated.priority ?? r.priority,
                apartadoListo: updated.apartadoListo ?? r.apartadoListo,
              }
            : r
        )
      );
    };
    window.addEventListener("update-record", handler);
    return () => window.removeEventListener("update-record", handler);
  }, []);

  const ready = records.filter((r) => r.apartadoListo);
  const pending = records.filter((r) => !r.apartadoListo);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-auto pb-4">

      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-base font-semibold">Mi trabajo</h1>
        <p className="text-xs text-muted-foreground">
          {records.length} expediente{records.length !== 1 ? "s" : ""} asignados
        </p>
      </div>

      {records.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground/40">
          <Inbox className="h-8 w-8" />
          <p className="text-sm">No tenés expedientes asignados</p>
        </div>
      ) : (
        <>
          {/* Apartado listo */}
          {ready.length > 0 && (
            <section className="shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Apartado listo
                </h2>
                <span className="text-xs text-muted-foreground/50">{ready.length}</span>
              </div>
              <div className="space-y-1.5">
                {ready.map((r) => (
                  <RecordRow key={r.id} record={r} onClick={() => setSelectedId(r.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Pendientes */}
          {pending.length > 0 && (
            <section className="shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                  {ready.length > 0 ? "Resto de mis expedientes" : "Mis expedientes"}
                </h2>
                <span className="text-xs text-muted-foreground/40">{pending.length}</span>
              </div>
              <div className="space-y-1.5">
                {pending.map((r) => (
                  <RecordRow key={r.id} record={r} onClick={() => setSelectedId(r.id)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <RecordDetailSheet recordId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
