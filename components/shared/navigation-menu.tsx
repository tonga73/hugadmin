"use client";
import * as React from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  NavigationMenu as NavigationMenuUI,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "../ui/sidebar";
import { UserMenu } from "./user-menu";
import { ViewSwitcher } from "./view-switcher";
import { useAuth } from "@/contexts/auth-context";
import { useView } from "@/contexts/view-context";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn, Home, PlusIcon, FolderOpen } from "lucide-react";
import { ChatNavButton } from "@/components/chat/chat-nav-button";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function NavigationMenu({ isAdmin = false, meId }: { isAdmin?: boolean; meId?: number }) {
  const isMobile = useIsMobile();
  const { loading, user } = useAuth();
  const { isFocus } = useView();

  return (
    <div className="flex w-full items-center gap-2">
      <NavigationMenuUI viewport={isMobile}>
        <NavigationMenuList>
          {!isFocus && (
            <NavigationMenuItem>
              <SidebarTrigger />
            </NavigationMenuItem>
          )}
          <NavigationMenuItem>
            <Button id="tour-home-button" variant="ghost" size="icon" asChild className="h-7 w-7">
              <Link href={isFocus ? "/?view=FOCUS" : "/"}>
                <Home className="h-4 w-4" />
              </Link>
            </Button>
          </NavigationMenuItem>
          {isFocus && (
            <>
              <NavigationMenuItem>
                <Button id="tour-focus-create" variant="ghost" size="icon" asChild className="h-7 w-7" title="Crear expediente">
                  <Link href="/records/create">
                    <PlusIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button id="tour-focus-unassigned" variant="ghost" size="icon" asChild className="h-7 w-7" title="Archivos sin asignar">
                  <Link href="/unassigned">
                    <FolderOpen className="h-4 w-4" />
                  </Link>
                </Button>
              </NavigationMenuItem>
            </>
          )}
        </NavigationMenuList>
      </NavigationMenuUI>

      {!loading && user && (
        <>
          <ViewSwitcher />
          {meId && <ChatNavButton meId={meId} />}
          <NotificationBell />
        </>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2 ml-auto">
        <ModeToggle />
        {loading ? (
          <Skeleton className="h-8 w-8 rounded-full" />
        ) : user ? (
          <UserMenu isAdmin={isAdmin} />
        ) : (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login" className="gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
