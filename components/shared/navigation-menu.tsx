"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import { UserMenu } from "./user-menu";
import { ViewSwitcher } from "./view-switcher";
import { useAuth } from "@/contexts/auth-context";
import { useView } from "@/contexts/view-context";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, Home, PlusIcon, FolderOpen } from "lucide-react";
import { ChatNavButton } from "@/components/chat/chat-nav-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";

const btn = "flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors";

export function NavigationMenu({ isAdmin = false, meId }: { isAdmin?: boolean; meId?: number }) {
  const { loading, user } = useAuth();
  const { isFocus } = useView();

  return (
    <div className="flex w-full items-center gap-1">

      {/* Left: sidebar toggle (overview only) + home */}
      <div className="flex items-center gap-0.5">
        {!isFocus && (
          <SidebarTrigger
            id="tour-sidebar-trigger"
            className={cn(btn, "data-[state=open]:bg-muted/60")}
          />
        )}
        <Link
          id="tour-home-button"
          href={isFocus ? "/?view=FOCUS" : "/"}
          className={btn}
          title="Inicio"
        >
          <Home className="h-4 w-4" />
        </Link>
      </div>

      {/* View switcher */}
      {!loading && user && (
        <div className="ml-1">
          <ViewSwitcher />
        </div>
      )}

      {/* Global actions — always visible regardless of mode */}
      <div className="flex items-center gap-0.5 ml-1">
        <Link
          id="tour-create-record"
          href="/records/create"
          className={btn}
          title="Crear expediente"
        >
          <PlusIcon className="h-4 w-4" />
        </Link>
        <Link
          id="tour-unassigned"
          href="/unassigned"
          className={btn}
          title="Archivos sin asignar"
        >
          <FolderOpen className="h-4 w-4" />
        </Link>
        {!loading && user && meId && (
          <>
            <ChatNavButton meId={meId} />
            <NotificationBell />
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Right utilities */}
      <div className="flex items-center gap-1">
        <ModeToggle />
        {loading ? (
          <Skeleton className="h-7 w-7 rounded-full" />
        ) : user ? (
          <UserMenu isAdmin={isAdmin} />
        ) : (
          <Link href="/login" className={cn(btn, "w-auto px-2 gap-1.5 text-xs font-medium")}>
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Iniciar sesión</span>
          </Link>
        )}
      </div>
    </div>
  );
}
