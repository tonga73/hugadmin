import { AppSidebar, NavigationMenu } from "@/components/shared";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "sonner";

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="flex-1 min-h-screen flex flex-col overflow-x-hidden p-3 space-y-3">
        <NavigationMenu />
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </main>
    </SidebarProvider>
  );
}
