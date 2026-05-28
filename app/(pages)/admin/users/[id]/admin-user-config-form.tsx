"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, ArrowLeft, BarChart2, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardView = "OVERVIEW" | "FOCUS";
type Role = "USER" | "ADMIN" | "PART" | "CLIENT" | "PERITO";

const DASHBOARD_OPTIONS: { value: DashboardView; label: string; icon: React.ElementType; description: string }[] = [
  { value: "OVERVIEW", icon: BarChart2, label: "Overview", description: "Pipeline completo y stats globales." },
  { value: "FOCUS", icon: Star, label: "Focus", description: "Solo expedientes destacados por prioridad." },
];

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "USER", label: "Usuario", description: "Acceso completo a expedientes y archivos." },
  { value: "ADMIN", label: "Admin", description: "Acceso total incluyendo panel de administración." },
  { value: "PERITO", label: "Perito", description: "Vista dedicada con sus expedientes asignados y apartado." },
  { value: "PART", label: "Parte", description: "Participante externo del expediente." },
  { value: "CLIENT", label: "Cliente", description: "Cliente con acceso limitado." },
];

export function AdminUserConfigForm({
  userId,
  userName,
  userEmail,
  userImage,
  userRole,
  userActive,
  userVisible,
  dashboardView,
  chatPanel,
}: {
  userId: number;
  userName: string | null;
  userEmail: string;
  userImage: string | null;
  userRole: Role;
  userActive: boolean;
  userVisible: boolean;
  dashboardView: DashboardView;
  chatPanel: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(userName ?? "");
  const [role, setRole] = useState<Role>(userRole);
  const [active, setActive] = useState(userActive);
  const [visible, setVisible] = useState(userVisible);
  const [view, setView] = useState<DashboardView>(dashboardView);
  const [chatPanelEnabled, setChatPanelEnabled] = useState(chatPanel);
  const [saving, setSaving] = useState(false);

  const handleActiveChange = (val: boolean) => {
    setActive(val);
    if (!val) setVisible(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const [userRes, configRes] = await Promise.all([
        fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() || null, role, active, visible }),
        }),
        fetch(`/api/users/${userId}/config`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dashboardView: view, chatPanel: chatPanelEnabled }),
        }),
      ]);
      if (!userRes.ok || !configRes.ok) throw new Error();
      toast.success("Cambios guardados");
      router.refresh();
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{userName ?? userEmail}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Datos del usuario */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Datos</p>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={userEmail}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border">
              <div>
                <p className="text-sm font-medium">Usuario activo</p>
                <p className="text-[11px] text-muted-foreground">Puede ingresar al sistema.</p>
              </div>
              <Switch checked={active} onCheckedChange={handleActiveChange} />
            </div>

            <div className={cn("flex items-center justify-between p-3 rounded-xl border transition-opacity", !active && "opacity-50")}>
              <div>
                <p className="text-sm font-medium">Visible en el sistema</p>
                <p className="text-[11px] text-muted-foreground">Aparece en listas de asignación y selección de usuarios.</p>
              </div>
              <Switch checked={visible} onCheckedChange={setVisible} disabled={!active} />
            </div>
          </div>
        </section>

        {/* Rol */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Rol</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRole(opt.value)}
                className={cn(
                  "flex flex-col gap-1 p-3 rounded-xl border text-left transition-all",
                  role === opt.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{opt.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Dashboard */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Preferencias</p>
          <div className="flex items-center justify-between p-3 rounded-xl border">
            <div>
              <p className="text-sm font-medium">Panel de chat flotante</p>
              <p className="text-[11px] text-muted-foreground">Muestra el chat como panel fijo en todas las páginas.</p>
            </div>
            <Switch checked={chatPanelEnabled} onCheckedChange={setChatPanelEnabled} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Vista por defecto</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DASHBOARD_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setView(opt.value)}
                  className={cn(
                    "flex flex-col gap-1.5 p-3 rounded-xl border text-left transition-all",
                    view === opt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
