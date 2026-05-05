import { getRecords } from "@/app/actions/getRecords";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { PlusIcon, FolderOpen, MessageSquare } from "lucide-react";
import { RecordsList } from "../records";
import { Logo } from "./logo";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfig } from "@/lib/user-config";

const sidebarItems = [
  { title: "Crear expediente", url: "/records/create", icon: PlusIcon },
  { title: "Archivos sin asignar", url: "/unassigned", icon: FolderOpen },
  { title: "Mensajes", url: "/chat", icon: MessageSquare },
];

export async function AppSidebar() {
  const [{ records, lastId, hasMore }, sessionUser] = await Promise.all([
    getRecords({ take: 10 }),
    getSessionUser(),
  ]);

  const config = sessionUser?.email ? await getUserViewConfig(sessionUser.email) : null;

  const recordsWithDates = records.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));

  return (
    <Sidebar>
      <SidebarContent className="h-screen overflow-hidden">
        <SidebarGroup>
          <Logo />
        </SidebarGroup>

        <SidebarGroup className="gap-3 py-0">
          <SidebarGroupContent>
            <SidebarGroupLabel>Expedientes</SidebarGroupLabel>
            <Separator />
          </SidebarGroupContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
          <SidebarGroupContent>
            <RecordsList
              initialRecords={recordsWithDates}
              lastId={lastId}
              hasMore={hasMore}
              initialTracingFilter={(config?.tracingFilter as string[]) ?? []}
              initialMinPriority={(config?.minPriority as string | null) ?? null}
              initialMine={config?.assignedToMeOnly ?? false}
              initialFavoritesOnly={config?.favoritesOnly ?? false}
            />
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="px-3 py-2">
        <p className="text-[10px] text-muted-foreground/40 leading-snug">
          v2.1.0 · Desarrollado por Hugo Mitoire
          <br />
          <span className="opacity-70">con el aporte técnico de Claudia</span>
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
