"use client";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function AttentionBadges({
  urgenteStat,
  altaStat,
  staleUrgenteCount,
  attentionCount,
}: {
  urgenteStat: number;
  altaStat: number;
  staleUrgenteCount: number;
  attentionCount: number;
}) {
  if (attentionCount === 0) {
    return <span className="text-muted-foreground/40">sin urgencias</span>;
  }

  return (
    <>
      {urgenteStat > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-red-400/80 cursor-default">{urgenteStat}u</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] px-2 py-1">urgentes</TooltipContent>
        </Tooltip>
      )}
      {urgenteStat > 0 && altaStat > 0 && (
        <span className="text-muted-foreground/50"> · </span>
      )}
      {altaStat > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-orange-400/80 cursor-default">{altaStat}a</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] px-2 py-1">alta prioridad</TooltipContent>
        </Tooltip>
      )}
      {staleUrgenteCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-red-400/60 cursor-default"> · {staleUrgenteCount} inactivos</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[10px] px-2 py-1">sin actividad &gt; 7 días</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}
