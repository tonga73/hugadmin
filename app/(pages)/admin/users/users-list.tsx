"use client";

import { useState } from "react";
import Link from "next/link";
import { User, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DASHBOARD_VIEW_LABELS: Record<string, string> = {
  OVERVIEW: "Overview",
  STAGE: "Etapa",
  FOCUS: "Focus",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  USER: "Usuario",
  PERITO: "Perito",
  PART: "Parte",
  CLIENT: "Cliente",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-primary border-primary/40 bg-primary/5",
  USER: "text-muted-foreground border-muted-foreground/20",
  PERITO: "text-emerald-600 border-emerald-400/40 bg-emerald-50/30 dark:text-emerald-400 dark:bg-emerald-950/30",
  PART: "text-amber-600 border-amber-400/40 bg-amber-50/30",
  CLIENT: "text-blue-600 border-blue-400/40 bg-blue-50/30",
};

const ROLE_ORDER: Record<string, number> = { ADMIN: 0, USER: 1, PERITO: 2, PART: 3, CLIENT: 4 };

type SortKey = "nombre" | "rol" | "vista";

type User = {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  active: boolean;
  visible: boolean;
  viewConfig: { dashboardView: string } | null;
};

function sortUsers(users: User[], key: SortKey): User[] {
  return [...users].sort((a, b) => {
    if (key === "nombre") return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    if (key === "rol") return (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9);
    if (key === "vista") {
      const va = a.viewConfig?.dashboardView ?? "OVERVIEW";
      const vb = b.viewConfig?.dashboardView ?? "OVERVIEW";
      return va.localeCompare(vb);
    }
    return 0;
  });
}

function UserRow({ user }: { user: User }) {
  const view = user.viewConfig?.dashboardView ?? "OVERVIEW";
  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
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
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {DASHBOARD_VIEW_LABELS[view]}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[user.role] ?? ROLE_COLORS.USER}`}>
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </div>
    </Link>
  );
}

export function UsersList({ users }: { users: User[] }) {
  const [sort, setSort] = useState<SortKey>("nombre");
  const [inactivosOpen, setInactivosOpen] = useState(false);

  const activos = sortUsers(users.filter((u) => u.active), sort);
  const visibles = activos.filter((u) => u.visible);
  const ocultos = activos.filter((u) => !u.visible);
  const inactivos = sortUsers(users.filter((u) => !u.active), sort);

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "nombre", label: "Nombre" },
    { key: "rol", label: "Rol" },
    { key: "vista", label: "Vista" },
  ];

  return (
    <div className="space-y-4">
      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold mr-1">Ordenar</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full border transition-colors",
              sort === opt.key
                ? "bg-primary/10 border-primary/30 text-primary font-medium"
                : "border-muted text-muted-foreground hover:border-muted-foreground/30"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Activos + visibles */}
      <div className="space-y-2">
        {visibles.map((user) => <UserRow key={user.id} user={user} />)}
      </div>

      {/* Activos pero ocultos en sistema */}
      {ocultos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              No visibles en sistema ({ocultos.length})
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          {ocultos.map((user) => (
            <div key={user.id} className="opacity-60">
              <UserRow user={user} />
            </div>
          ))}
        </div>
      )}

      {/* Inactivos — collapsible */}
      {inactivos.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setInactivosOpen((v) => !v)}
            className="flex items-center gap-2 w-full group"
          >
            <div className="h-px flex-1 bg-border" />
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 group-hover:text-muted-foreground/80 transition-colors">
              {inactivosOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Inactivos ({inactivos.length})
            </span>
            <div className="h-px flex-1 bg-border" />
          </button>

          {inactivosOpen && (
            <div className="space-y-2">
              {inactivos.map((user) => (
                <div key={user.id} className="opacity-40">
                  <UserRow user={user} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
