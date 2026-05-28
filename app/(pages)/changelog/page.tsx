import { CHANGELOG_ENTRIES } from "@/app/constants/changelog";
import { APP_VERSION } from "@/app/constants/version";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, Sparkles } from "lucide-react";

export default function ChangelogPage() {
  const latest = CHANGELOG_ENTRIES[0];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Novedades</h1>
          <p className="text-sm text-muted-foreground">
            Versión actual:{" "}
            <span className="font-mono font-medium text-foreground">
              v{APP_VERSION}
            </span>
          </p>
        </div>

        {CHANGELOG_ENTRIES.map((entry, index) => (
          <Card key={entry.version} className={index === 0 ? "border-primary/30 bg-primary/5" : ""}>
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold">
                  v{entry.version}
                </span>
                {index === 0 && (
                  <Badge variant="default" className="text-[10px] h-4 px-1.5 gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" />
                    NUEVO
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {entry.date}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground/80 mt-0.5">
                {entry.summary}
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="space-y-2">
                {entry.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary/60 mt-0.5 shrink-0" />
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
