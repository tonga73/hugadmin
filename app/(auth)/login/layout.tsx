import { AppSidebar } from "@/components/shared";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 min-h-screen overflow-x-hidden p-3 space-y-3">
      {children}
    </main>
  );
}
