import { AppSidebar, NavigationMenu } from "@/components/shared";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { getSessionUser } from "@/lib/session";
import { getUserRole, getUserViewConfig } from "@/lib/user-config";
import { cookies } from "next/headers";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionUser, cookieStore] = await Promise.all([getSessionUser(), cookies()]);
  const email = sessionUser?.email;
  const [userRole, userConfig] = await Promise.all([
    email ? getUserRole(email) : Promise.resolve(null),
    email ? getUserViewConfig(email) : Promise.resolve(null),
  ]);
  const isAdmin = userRole === "ADMIN";
  const defaultIsFocus = userConfig?.dashboardView === "FOCUS";
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <AppSidebar />

      <main className="flex-1 h-screen flex flex-col overflow-hidden p-3 space-y-3">
        <NavigationMenu isAdmin={isAdmin} defaultIsFocus={defaultIsFocus} />
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </main>
    </SidebarProvider>
  );
}
