"use client";

import { Wrench, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full mx-auto px-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <Wrench className="h-7 w-7 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold">Sistema en mantenimiento</h1>
          <p className="text-sm text-muted-foreground">
            Estamos realizando mejoras. Volvé en unos minutos.
          </p>
        </div>
        {user && (
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}
