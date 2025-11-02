import { TRACING_OPTIONS } from "@/app/constants";
import { Badge } from "@/components/ui/badge";

interface BadgeTracingProps {
  tracing: keyof typeof TRACING_OPTIONS;
}

export function TracingBadge({ tracing }: BadgeTracingProps) {
  const { label, color } = TRACING_OPTIONS[tracing];

  return (
    <Badge
      style={{
        backgroundColor: color,
        color: "#fff",
      }}
    >
      {label}
    </Badge>
  );
}
