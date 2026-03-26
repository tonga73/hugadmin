import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import prisma from "@/lib/prisma";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { PRIORITY_OPTIONS } from "@/app/constants/priority";
import Link from "next/link";

export async function FocusDashboard() {
  const [favorites, totalFavorites, urgente, alta] = await Promise.all([
    prisma.record.findMany({
      where: { favorite: true },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 20,
      select: {
        id: true,
        order: true,
        name: true,
        tracing: true,
        priority: true,
        updatedAt: true,
        _count: { select: { Note: true, files: true } },
      },
    }),
    prisma.record.count({ where: { favorite: true } }),
    prisma.record.count({ where: { favorite: true, priority: "URGENTE" } }),
    prisma.record.count({ where: { favorite: true, priority: "ALTA" } }),
  ]);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5 shrink-0">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Destacados</p>
            </div>
            <p className="text-3xl font-bold">{totalFavorites}</p>
            <p className="text-[10px] text-muted-foreground">expedientes marcados</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Urgentes</p>
            <p className="text-3xl font-bold text-red-400">{urgente}</p>
            <p className="text-[10px] text-muted-foreground">requieren atención inmediata</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Alta prioridad</p>
            <p className="text-3xl font-bold text-orange-400">{alta}</p>
            <p className="text-[10px] text-muted-foreground">a resolver próximamente</p>
          </CardHeader>
        </Card>
      </div>

      {/* Favorites list */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-sm">Tus expedientes destacados</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3 pt-0 space-y-1">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Star className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No hay expedientes destacados</p>
            </div>
          ) : (
            favorites.map((r) => {
              const tracing = TRACING_OPTIONS[r.tracing];
              const priority = PRIORITY_OPTIONS[r.priority];
              return (
                <Link
                  key={r.id}
                  href={`/records/${r.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground shrink-0 w-20 truncate">{r.order}</span>
                  <span className="text-xs flex-1 truncate">{r.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {priority && r.priority !== "NULA" && (
                      <Badge
                        className="h-4 text-[9px] px-1.5"
                        style={{ backgroundColor: priority.color, color: "#1a1a1a" }}
                      >
                        {priority.label}
                      </Badge>
                    )}
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: tracing?.color + "33", color: tracing?.textColor }}
                    >
                      {tracing?.label}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
