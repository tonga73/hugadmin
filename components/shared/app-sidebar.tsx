import { getRecords } from "@/app/actions/getRecords";
import { RecordsList } from "./records-list";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { Separator } from "../ui/separator";
import { PlusIcon } from "lucide-react";

const sidebarItems = [
  {
    title: "Crear expediente",
    url: "/records/create",
    icon: PlusIcon,
  },
];

export async function AppSidebar() {
  const { records, lastId, hasMore } = await getRecords({ take: 10 });

  return (
    <Sidebar>
      <SidebarContent className="h-screen overflow-hidden">
        <SidebarGroup>
          <Image
            alt="Logo Hugadmin"
            src="/hugadmin_logo.png"
            width={100}
            height={300}
          />
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
              initialRecords={records}
              lastId={lastId}
              hasMore={hasMore}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
