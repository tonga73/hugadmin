import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import { Users, ShieldCheck, Activity } from "lucide-react";
import { MaintenanceToggle } from "./maintenance-toggle";

export default async function AdminPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") redirect("/");

  const [userCount, recordCount, maintenanceConfig] = await Promise.all([
    prisma.user.count(),
    prisma.record.count(),
    prisma.config.findUnique({ where: { key: "maintenance_mode" } }).catch(() => null),
  ]);
  const maintenanceEnabled = maintenanceConfig?.value === "true";

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Panel de administración</h1>
            <p className="text-sm text-muted-foreground">Gestión y configuración del sistema.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Usuarios</p>
            <p className="text-2xl font-bold">{userCount}</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Expedientes</p>
            <p className="text-2xl font-bold">{recordCount}</p>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-2">
          <MaintenanceToggle initialEnabled={maintenanceEnabled} />
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Usuarios</p>
              <p className="text-xs text-muted-foreground">Configurá la vista de cada usuario.</p>
            </div>
          </Link>
          <Link
            href="/admin/activity"
            className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Actividad</p>
              <p className="text-xs text-muted-foreground">Historial global de movimientos del sistema.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
