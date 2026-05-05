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
  const defaultIsFocus = userConfig?.dashboardView === "FOCUS";
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const chatPanelEnabled = userConfig?.chatPanel ?? false;

  const allUsers = chatPanelEnabled && dbUser
    ? await prisma.user.findMany({
        where: { active: true, visible: true },
        select: { id: true, name: true, email: true, image: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <ViewProvider defaultIsFocus={defaultIsFocus}>
      <SidebarProvider defaultOpen={sidebarDefaultOpen}>
        <AppSidebar />

        <main className="flex-1 h-screen flex flex-col overflow-hidden p-3 space-y-3">
          <NavigationMenu isAdmin={isAdmin} />
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
