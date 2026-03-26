import { getSessionUser } from "@/lib/session";
import { getUserViewConfig } from "@/lib/user-config";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { StageDashboard } from "@/components/dashboard/stage-dashboard";
import { FocusDashboard } from "@/components/dashboard/focus-dashboard";

interface Props {
  searchParams: Promise<{ view?: string; tracing?: string; fav?: string; priority?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;

  // URL params take precedence — no DB call needed when navigating client-side
  const hasUrlConfig = params.view || params.tracing || params.fav || params.priority;

  let view = params.view?.toUpperCase() ?? null;
  let tracingFilter: string[] = params.tracing ? params.tracing.split(",").filter(Boolean) : [];
  let favoritesOnly = params.fav === "1";

  if (!hasUrlConfig) {
    // Fall back to DB config on first load
    const sessionUser = await getSessionUser();
    const config = sessionUser?.email ? await getUserViewConfig(sessionUser.email) : null;
    view = config?.dashboardView ?? "OVERVIEW";
    tracingFilter = (config?.tracingFilter as string[]) ?? [];
    favoritesOnly = config?.favoritesOnly ?? false;
  }

  if (view === "FOCUS" || favoritesOnly) return <FocusDashboard />;
  if (view === "STAGE") return <StageDashboard tracingFilter={tracingFilter} />;
  return <OverviewDashboard />;
}
