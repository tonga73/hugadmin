"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
import { toast } from "sonner";

export function MaintenanceToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/config/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!res.ok) throw new Error();
      setEnabled((v) => !v);
      toast.success(!enabled ? "Modo mantenimiento activado" : "Modo mantenimiento desactivado");
    } catch {
      toast.error("No se pudo actualizar el modo mantenimiento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
        enabled
          ? "bg-destructive/10 border-destructive/30 hover:bg-destructive/15"
          : "bg-card hover:bg-muted/30"
      }`}
    >
      <div
        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
          enabled ? "bg-destructive/20" : "bg-muted"
        }`}
      >
        <Wrench className={`h-4 w-4 ${enabled ? "text-destructive" : "text-muted-foreground"}`} />
      </div>
      <div className="text-left">
        <p className="text-sm font-medium">
          {enabled ? "Desactivar mantenimiento" : "Activar modo mantenimiento"}
        </p>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? "El sistema está en mantenimiento — solo admins pueden acceder."
            : "Bloquea el acceso a todos los usuarios excepto admins."}
        </p>
      </div>
      <div className="ml-auto shrink-0">
        <div
          className={`h-2 w-2 rounded-full ${enabled ? "bg-destructive" : "bg-muted-foreground/30"}`}
        />
      </div>
    </button>
  );
}
