import { getRecords } from "@/app/actions/getRecords";
import { RecordsList } from "./records-list";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import Image from "next/image";

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

        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="p-2 text-sm">Crear Expediente</div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Expedientes</SidebarGroupLabel>
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
