import { AppSidebar, NavigationMenu } from "@/components/shared";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ViewProvider } from "@/contexts/view-context";
import { Toaster } from "sonner";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfig } from "@/lib/user-config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ChatPanel } from "@/components/chat/chat-panel";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionUser, cookieStore] = await Promise.all([getSessionUser(), cookies()]);
  const email = sessionUser?.email;
  const [dbUser, userConfig, maintenanceConfig] = await Promise.all([
    email ? prisma.user.findUnique({ where: { email }, select: { id: true, role: true, active: true } }) : Promise.resolve(null),
    email ? getUserViewConfig(email) : Promise.resolve(null),
    prisma.config.findUnique({ where: { key: "maintenance_mode" } }).catch(() => null),
  ]);

  if (dbUser && !dbUser.active) redirect("/login");
  const userRole = dbUser?.role ?? null;

  if (maintenanceConfig?.value === "true" && userRole !== "ADMIN") {
    redirect("/maintenance");
  }
  const isAdmin = userRole === "ADMIN";
  const isPerito = userRole === "PERITO";
  const defaultIsFocus = userConfig?.dashboardView === "FOCUS";
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const chatPanelEnabled = userConfig?.chatPanel ?? false;

  const allUsers = chatPanelEnabled && dbUser
    ? await prisma.user.findMany({
        where: { active: true },
        select: { id: true, name: true, email: true, image: true },
        orderBy: { name: "asc" },
      })
    : [];

  // Layout exclusivo para peritos: sin sidebar, sin controles del dashboard normal
  if (isPerito) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2 border-b border-border/40 shrink-0">
          <span
            className="font-montserrat text-xl font-light uppercase select-none"
            style={{
              background: "linear-gradient(to right, #07f49e, #0380b6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            HA
          </span>
          <NavigationMenu isAdmin={false} isPerito={true} meId={dbUser?.id} />
        </header>
        <main className="flex-1 min-h-0 overflow-hidden p-3">
          {children}
        </main>
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    );
  }

  return (
    <ViewProvider defaultIsFocus={defaultIsFocus}>
      <SidebarProvider defaultOpen={sidebarDefaultOpen}>
        <AppSidebar />

        <main className="flex-1 h-screen flex flex-col overflow-hidden p-3 space-y-3">
          <NavigationMenu isAdmin={isAdmin} isPerito={false} meId={dbUser?.id} />
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </main>

        {chatPanelEnabled && dbUser && (
          <ChatPanel meId={dbUser.id} allUsers={allUsers} />
        )}
      </SidebarProvider>
    </ViewProvider>
  );
}
