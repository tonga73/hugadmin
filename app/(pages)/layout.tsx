import { AppSidebar, NavigationMenu } from "@/components/shared";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { getSessionUser } from "@/lib/session";
import { getUserRole } from "@/lib/user-config";
import { cookies } from "next/headers";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessionUser, cookieStore] = await Promise.all([getSessionUser(), cookies()]);
  const userRole = sessionUser?.email ? await getUserRole(sessionUser.email) : null;
  const isAdmin = userRole === "ADMIN";
  const sidebarDefaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen}>
      <AppSidebar />

      <main className="flex-1 h-screen flex flex-col overflow-hidden p-3 space-y-3">
        <NavigationMenu isAdmin={isAdmin} />
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </main>
    </SidebarProvider>
  );
}
