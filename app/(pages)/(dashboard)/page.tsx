import { getSessionUser } from "@/lib/session";
import { getUserViewConfig } from "@/lib/user-config";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { StageDashboard } from "@/components/dashboard/stage-dashboard";
import { FocusDashboard } from "@/components/dashboard/focus-dashboard";
import { HybridDashboard } from "@/components/dashboard/hybrid-dashboard";

export default async function Home() {
  const sessionUser = await getSessionUser();
  const config = sessionUser?.email ? await getUserViewConfig(sessionUser.email) : null;

  const dashboardView = config?.dashboardView ?? "OVERVIEW";

  if (dashboardView === "FOCUS" || config?.favoritesOnly) {
    return <FocusDashboard />;
  }

  if (dashboardView === "STAGE" && config?.tracingFilter && config.tracingFilter.length > 0) {
    return <StageDashboard tracingFilter={config.tracingFilter as string[]} />;
  }

  if (dashboardView === "HYBRID") {
    return (
      <HybridDashboard
        tracingFilter={(config?.tracingFilter as string[]) ?? []}
        favoritesOnly={config?.favoritesOnly ?? false}
        minPriority={(config?.minPriority as string) ?? null}
      />
    );
  }

  return <OverviewDashboard />;
}
