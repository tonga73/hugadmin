import { getRecords } from "@/app/actions/getRecords";
import { RecordsList } from "./records-list";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

export async function AppSidebar() {
  const { records, lastId, hasMore } = await getRecords({ take: 10 });

  return (
    <Sidebar>
      <SidebarContent className="h-screen overflow-hidden">
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
