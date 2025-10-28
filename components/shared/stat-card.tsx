import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { CircularProgress } from "./circular-progress";

interface StatCardProps {
  color: string;
  count: number;
  description?: string;
  title: string;
  progress: number;
  strokeColor?: string;
  variant?: "default" | "vertical";
}

export const StatCard: React.FC<StatCardProps> = ({
  color,
  count,
  description,
  title,
  progress,
  strokeColor,
  variant = "default",
}) => {
  if (variant === "default") {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="w-full h-full max-h-64 flex items-center justify-center">
            <CircularProgress progress={progress} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // variante vertical
  return (
    <Card className="h-full flex items-center gap-4">
      <div className="flex-1">{title}</div>
      <div className="w-24 h-24">
        <CircularProgress progress={progress} />
      </div>
    </Card>
  );
};
