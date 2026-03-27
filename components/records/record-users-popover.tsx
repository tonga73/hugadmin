"use client";

import { useState, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
}

interface RecordUsersPopoverProps {
  recordId: number;
  /** Pre-loaded assignees (optional — will fetch if not provided) */
  initialAssignees?: User[];
  size?: "sm" | "md";
}

export function RecordUsersPopover({ recordId, initialAssignees, size = "md" }: RecordUsersPopoverProps) {
  const [assignees, setAssignees] = useState<User[]>(initialAssignees ?? []);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loaded, setLoaded] = useState(!!initialAssignees);

  const load = useCallback(async () => {
    if (loaded) return;
    const [assigneesRes, usersRes] = await Promise.all([
      fetch(`/api/records/${recordId}/users`).then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]);
    setAssignees(assigneesRes);
    setAllUsers(usersRes);
    setLoaded(true);
  }, [loaded, recordId]);

  const loadAllUsers = useCallback(async () => {
    if (allUsers.length > 0) return;
    const users = await fetch("/api/users").then((r) => r.json());
    setAllUsers(users);
  }, [allUsers.length]);

  const handleOpen = useCallback(async (open: boolean) => {
    if (open) {
      await Promise.all([load(), loadAllUsers()]);
    }
  }, [load, loadAllUsers]);

  const assign = useCallback(async (user: User) => {
    if (assignees.some((a) => a.id === user.id)) return;
    setAssignees((prev) => [...prev, user]);
    await fetch(`/api/records/${recordId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [user.id] }),
    }).catch(() => setAssignees((prev) => prev.filter((a) => a.id !== user.id)));
  }, [assignees, recordId]);

  const unassign = useCallback(async (userId: number) => {
    setAssignees((prev) => prev.filter((a) => a.id !== userId));
    await fetch(`/api/records/${recordId}/users/${userId}`, { method: "DELETE" })
      .catch(async () => {
        const fresh = await fetch(`/api/records/${recordId}/users`).then((r) => r.json());
        setAssignees(fresh);
      });
  }, [recordId]);

  const available = allUsers.filter((u) => !assignees.some((a) => a.id === u.id));

  const btnSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const badgeSize = size === "sm" ? "h-3 w-3 text-[8px] -top-0.5 -right-0.5" : "h-3.5 w-3.5 text-[9px] -top-0.5 -right-0.5";

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative transition-all shrink-0",
            btnSize,
            assignees.length > 0
              ? "text-blue-400 hover:text-blue-500"
              : "text-muted-foreground/40 hover:text-foreground"
          )}
          title="Usuarios asignados"
          onClick={(e) => e.stopPropagation()}
        >
          <Users className={iconSize} />
          {assignees.length > 0 && (
            <span className={cn(
              "absolute rounded-full bg-blue-400 font-bold text-white flex items-center justify-center leading-none",
              badgeSize
            )}>
              {assignees.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 mb-1.5">
          Asignados
        </p>

        {assignees.length > 0 && (
          <div className="mb-2 space-y-0.5">
            {assignees.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 px-1 py-0.5 rounded hover:bg-muted group">
                <span className="text-xs truncate">{a.name ?? a.email}</span>
                <button
                  onClick={() => unassign(a.id)}
                  className="text-muted-foreground/30 hover:text-destructive transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {assignees.length === 0 && (
          <p className="text-xs text-muted-foreground px-1 py-0.5 mb-1">Sin asignar</p>
        )}

        {available.length > 0 && (
          <div className={cn("space-y-0.5", assignees.length > 0 && "border-t pt-2 mt-1")}>
            <p className="text-[10px] text-muted-foreground/50 px-1 mb-1">Agregar</p>
            {available.map((u) => (
              <button
                key={u.id}
                onClick={() => assign(u)}
                className="w-full text-left px-1 py-0.5 rounded text-xs hover:bg-muted transition-colors truncate"
              >
                {u.name ?? u.email}
              </button>
            ))}
          </div>
        )}

        {allUsers.length > 0 && available.length === 0 && assignees.length > 0 && (
          <p className="text-xs text-muted-foreground px-1 py-1 border-t mt-1">Todos asignados</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
