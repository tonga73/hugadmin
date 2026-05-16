"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

interface ProfileFormProps {
  initialName: string | null;
  initialImage: string | null;
  email: string;
  role: "ADMIN" | "USER" | "PART" | "CLIENT";
}

const ROLE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ADMIN:  { label: "Administrador", variant: "default" },
  USER:   { label: "Usuario",       variant: "secondary" },
  PART:   { label: "Participante",  variant: "outline" },
  CLIENT: { label: "Cliente",       variant: "outline" },
};

function getInitials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function ProfileForm({ initialName, initialImage, email, role }: ProfileFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [image, setImage] = useState(initialImage ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const roleConfig = ROLE_LABELS[role] ?? ROLE_LABELS.USER;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      });
      if (!res.ok) throw new Error();
      setDirty(false);
      toast.success("Perfil actualizado");
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card flex flex-col gap-0 overflow-hidden">
      {/* Hero: avatar + identidad */}
      <div className="flex flex-col items-center gap-3 px-6 py-6 text-center bg-muted/20">
        <Avatar className="h-20 w-20 ring-2 ring-border">
          <AvatarImage src={image || undefined} />
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials(name || null)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-semibold text-base leading-tight">
            {name || <span className="text-muted-foreground font-normal italic text-sm">Sin nombre</span>}
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[180px]">{email}</span>
          </div>
          <div className="pt-0.5">
            <Badge variant={roleConfig.variant} className="text-[10px] px-2 py-0">
              {roleConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Formulario de edición */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
          Editar perfil
        </p>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground/70">Nombre</label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
            placeholder="Tu nombre"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground/70">Foto de perfil (URL)</label>
          <Input
            value={image}
            onChange={(e) => { setImage(e.target.value); setDirty(true); }}
            placeholder="https://..."
            className="h-8 text-sm"
          />
          <p className="text-[10px] text-muted-foreground/40">
            Por defecto se usa la foto de Google.
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          size="sm"
          className="w-full"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
