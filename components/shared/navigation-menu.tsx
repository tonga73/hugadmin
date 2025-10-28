"use client";
import * as React from "react";
import Link from "next/link";
import { CircleCheckIcon, CircleHelpIcon, CircleIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  NavigationMenu as NavigationMenuUI,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "../ui/sidebar";
import { UserMenu } from "./user-menu";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function NavigationMenu() {
  const isMobile = useIsMobile();
  const { loading, user } = useAuth();

  // ✅ Debug
  console.log("🔍 NavigationMenu render");
  console.log("   - loading:", loading);
  console.log("   - user:", user);

  return (
    <div className="flex w-full items-center justify-between">
      <NavigationMenuUI viewport={isMobile}>
        <NavigationMenuList className="flex-wrap">
          <NavigationMenuItem>
            <SidebarTrigger />
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenuUI>

      <div className="flex items-center gap-2">
        <ModeToggle />
        {loading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ) : user ? (
          <UserMenu />
        ) : (
          <span className="text-xs">No user</span>
        )}
      </div>
    </div>
  );
}
