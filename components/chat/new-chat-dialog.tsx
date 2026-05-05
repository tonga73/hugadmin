"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Chat, ChatUser } from "./chat-types";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  users: ChatUser[];
  meId: number;
  onCreated: (chat: Chat) => void;
}

export function NewChatDialog({ open, onOpenChange, users, meId, onCreated }: NewChatDialogProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);

  const isGroup = selected.length > 1;

  const toggle = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selected, isGroup, name: isGroup ? groupName || null : null }),
      });
      if (!res.ok) throw new Error();
      const chat = await res.json();
      onCreated(chat);
      setSelected([]);
      setGroupName("");
    } catch {
      toast.error("No se pudo crear la conversación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Nueva conversación</DialogTitle>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Seleccioná uno o más usuarios. Si elegís varios, se crea un grupo.
          </p>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {users.map((user) => {
              const sel = selected.includes(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggle(user.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors text-left",
                    sel ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
                    {user.name && <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>}
                  </div>
                  {sel && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {isGroup && (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nombre del grupo (opcional)"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button size="sm" disabled={selected.length === 0 || loading} onClick={handleCreate}>
              {isGroup ? <Users className="h-3.5 w-3.5 mr-1.5" /> : <User className="h-3.5 w-3.5 mr-1.5" />}
              {isGroup ? "Crear grupo" : "Iniciar chat"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
