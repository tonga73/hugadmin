import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { Badge } from "@/components/ui/badge";

const DASHBOARD_VIEW_LABELS: Record<string, string> = {
  OVERVIEW: "Overview",
  STAGE: "Etapa",
  FOCUS: "Focus",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  USER: "Usuario",
  PART: "Parte",
  CLIENT: "Cliente",
};

export default async function AdminUsersPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    include: { viewConfig: true },
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Usuarios</h1>
            <p className="text-sm text-muted-foreground">
              Configurá la vista de cada usuario.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {users.map((user) => {
            const config = user.viewConfig;
            const view = config?.dashboardView ?? "OVERVIEW";
            const tracingCount = config?.tracingFilter?.length ?? 0;

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">
                      {user.name ?? user.email}
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 px-1 rounded border border-muted-foreground/20">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {DASHBOARD_VIEW_LABELS[view]}
                  </span>
                  {tracingCount > 0 && (
                    <div className="flex gap-0.5">
                      {(config!.tracingFilter as string[]).slice(0, 3).map((t) => (
                        <div
                          key={t}
                          className="h-2 w-2 rounded-full"
                          style={{ background: TRACING_OPTIONS[t]?.color }}
                          title={TRACING_OPTIONS[t]?.label}
                        />
                      ))}
                      {tracingCount > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{tracingCount - 3}</span>
                      )}
                    </div>
                  )}
                  {config?.favoritesOnly && (
                    <Badge variant="outline" className="h-4 text-[9px] px-1 border-amber-400 text-amber-500">
                      ★
                    </Badge>
                  )}
                </div>

                <Link
                  href={`/admin/users/${user.id}`}
                  className="text-[11px] font-medium text-primary hover:underline shrink-0"
                >
                  Editar
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
