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
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn } from "lucide-react";

export function NavigationMenu({ isAdmin = false }: { isAdmin?: boolean }) {
  const isMobile = useIsMobile();
  const { loading, user } = useAuth();

  return (
    <div className="flex w-full items-center gap-2">
      <NavigationMenuUI viewport={isMobile}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <SidebarTrigger />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuUI>

      {/* Center: view switcher (only when logged in) */}
      {!loading && user && (
        <div className="flex-1">
          <ViewSwitcher />
        </div>
      )}

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
