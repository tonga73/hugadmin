import { getRecords } from "@/app/actions/getRecords";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { RecordsList } from "../records";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfig } from "@/lib/user-config";

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
      <SidebarContent className="h-screen overflow-hidden flex flex-col">

        {/* Brand header */}
        <div className="flex items-center px-4 py-3 shrink-0 border-b border-sidebar-border/40">
          <span
            className="font-montserrat text-2xl font-light uppercase select-none"
            style={{
              background: "linear-gradient(to right, #07f49e, #0380b6)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            HA
          </span>
        </div>

        {/* Records list */}
        <div id="tour-records-list" className="flex-1 min-h-0 overflow-hidden">
          <RecordsList
            initialRecords={recordsWithDates}
            lastId={lastId}
            hasMore={hasMore}
            initialTracingFilter={(config?.tracingFilter as string[]) ?? []}
            initialMinPriority={(config?.minPriority as string | null) ?? null}
            initialMine={config?.assignedToMeOnly ?? false}
            initialFavoritesOnly={config?.favoritesOnly ?? false}
          />
        </div>

      </SidebarContent>

      <SidebarFooter className="px-4 py-2 border-t border-sidebar-border/30">
        <a
          href="https://tonga73.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
        >
          desarrollado por gastoire
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
