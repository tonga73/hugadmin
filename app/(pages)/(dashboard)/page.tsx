import { getSessionUser } from "@/lib/session";
import { getUserViewConfig } from "@/lib/user-config";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { StageDashboard } from "@/components/dashboard/stage-dashboard";
import { FocusDashboard } from "@/components/dashboard/focus-dashboard";

export default async function Home() {
  const sessionUser = await getSessionUser();
  const config = sessionUser?.email ? await getUserViewConfig(sessionUser.email) : null;

  const dashboardView = config?.dashboardView ?? "OVERVIEW";

  if (dashboardView === "FOCUS" || config?.favoritesOnly) {
    return <FocusDashboard />;
  }

  if (dashboardView === "STAGE") {
    return <StageDashboard tracingFilter={(config?.tracingFilter as string[]) ?? []} />;
  }

  // OVERVIEW (and legacy HYBRID)
  return <OverviewDashboard />;
}
