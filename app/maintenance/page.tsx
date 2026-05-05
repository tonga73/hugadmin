import { Wrench } from "lucide-react";

export default function MaintenancePage() {
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
      </div>
    </div>
  );
}
