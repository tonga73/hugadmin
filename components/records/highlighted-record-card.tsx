"use client";

import { forwardRef } from "react";
import { X } from "lucide-react";
import { Record } from "@/app/generated/prisma/client";
import { PRIORITY_OPTIONS } from "@/app/constants";
import { TracingBadge } from "./tracing-badge";

interface HighlightedRecordCardProps {
  record: Record;
  onClose: () => void;
  onClick: () => void;
  showSeparator?: boolean;
}

export const HighlightedRecordCard = forwardRef<
  HTMLDivElement,
  HighlightedRecordCardProps
>(({ record, onClose, onClick, showSeparator = true }, ref) => {
  return (
    <div className="p-2 pb-0">
      <div
        ref={ref}
        className="rounded-xl overflow-hidden shadow-lg ring-2 ring-blue-500 dark:ring-blue-400 bg-linear-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900"
      >
        {/* Header */}
        <div className="bg-blue-500 dark:bg-blue-600 px-3 py-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-white font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Resultado de búsqueda
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white/70 hover:text-white hover:bg-white/20 rounded p-0.5 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido */}
        <button
          className="w-full p-3 text-left hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
          onClick={onClick}
          style={{
            borderLeft: `4px solid ${PRIORITY_OPTIONS[record.priority].color}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-blue-700 dark:text-blue-300">
              {record.order}
            </span>
            <TracingBadge tracing={record.tracing} />
          </div>
          <span className="text-sm uppercase font-medium">{record.name}</span>
        </button>
      </div>

      {/* Separador */}
      {showSeparator && (
        <div className="flex items-center gap-2 py-3">
          <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
          <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium px-2">
            Expedientes
          </span>
          <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
        </div>
      )}
    </div>
  );
});

HighlightedRecordCard.displayName = "HighlightedRecordCard";

