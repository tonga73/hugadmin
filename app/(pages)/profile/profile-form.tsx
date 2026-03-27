"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileFormProps {
  initialName: string | null;
  initialImage: string | null;
  email: string;
}

function getInitials(name: string | null) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function ProfileForm({ initialName, initialImage, email }: ProfileFormProps) {
  const [name, setName] = useState(initialName ?? "");
  const [image, setImage] = useState(initialImage ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

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
    <Card className="max-w-md">
      <CardHeader className="pb-3">
        {/* Avatar + identidad */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage src={image || undefined} />
            <AvatarFallback className="text-base font-medium">
              {getInitials(name || null)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{name || <span className="text-muted-foreground font-normal italic">Sin nombre</span>}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Nombre
          </label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
            placeholder="Tu nombre"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Foto de perfil (URL)
          </label>
          <Input
            value={image}
            onChange={(e) => { setImage(e.target.value); setDirty(true); }}
            placeholder="https://..."
          />
          <p className="text-[11px] text-muted-foreground/50">
            Por defecto se usa la foto de Google. Podés reemplazarla con cualquier URL de imagen.
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
      </CardContent>
    </Card>
  );
}
