import { TRACING_OPTIONS } from "@/app/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BadgeTracingProps {
  tracing: keyof typeof TRACING_OPTIONS;
  size?: "default" | "sm";
}

export function TracingBadge({ tracing, size = "default" }: BadgeTracingProps) {
  const { label, color, textColor } = TRACING_OPTIONS[tracing];

  return (
    <Badge
      style={{
        backgroundColor: color,
        color: textColor,
      }}
      className={cn(
        size === "sm" && "text-[10px] px-1.5 py-0"
      )}
    >
      {label}
    </Badge>
  );
}
