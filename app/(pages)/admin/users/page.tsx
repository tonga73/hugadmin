import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-primary border-primary/40 bg-primary/5",
  USER: "text-muted-foreground border-muted-foreground/20",
  PART: "text-amber-600 border-amber-400/40 bg-amber-50/30",
  CLIENT: "text-blue-600 border-blue-400/40 bg-blue-50/30",
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
            <p className="text-sm text-muted-foreground">{users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}.</p>
          </div>
        </div>

        <div className="space-y-2">
          {users.map((user) => {
            const view = user.viewConfig?.dashboardView ?? "OVERVIEW";

            return (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors",
                  !user.active && "opacity-50"
                )}
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
                  <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!user.active && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-muted-foreground/20 text-muted-foreground">
                      Inactivo
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {DASHBOARD_VIEW_LABELS[view]}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[user.role] ?? ROLE_COLORS.USER}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
