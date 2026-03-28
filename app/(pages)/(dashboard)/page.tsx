import { Suspense } from "react";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfig } from "@/lib/user-config";
import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { FocusDashboard } from "@/components/dashboard/focus-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import prisma from "@/lib/prisma";

function DashboardSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5">
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="flex-1 grid grid-cols-3 gap-1.5 min-h-0">
        <Skeleton className="col-span-2 rounded-xl" />
        <Skeleton className="rounded-xl" />
      </div>
    </div>
  );
}

interface Props {
  searchParams: Promise<{ view?: string; lm?: string; lf?: string; lt?: string; lp?: string }>;
}

async function resolveAssignedToUserId(email: string): Promise<number | undefined> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return user?.id ?? undefined;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const urlView = params.view?.toUpperCase() ?? null;

  // OVERVIEW with explicit URL param
  if (urlView === "OVERVIEW") {
    let assignedToUserId: number | undefined;
    const urlMine = params.lm === "1";
    if (urlMine) {
      const sessionUser = await getSessionUser();
      if (sessionUser?.email) assignedToUserId = await resolveAssignedToUserId(sessionUser.email);
    }
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <OverviewDashboard
          assignedToUserId={assignedToUserId}
          favoritesOnly={params.lf === "1"}
          initialMine={urlMine}
        />
      </Suspense>
    );
  }

  // FOCUS with explicit URL param — resolve mine filter if needed, pass all params
  if (urlView === "FOCUS") {
    let assignedToUserId: number | undefined;
    const urlMine = params.lm === "1";
    if (urlMine) {
      const sessionUser = await getSessionUser();
      if (sessionUser?.email) assignedToUserId = await resolveAssignedToUserId(sessionUser.email);
    }
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <FocusDashboard
          assignedToUserId={assignedToUserId}
          favoritesOnly={params.lf === "1"}
          tracingFilter={params.lt ? params.lt.split(",").filter(Boolean) : []}
          minPriority={params.lp || null}
          initialMine={params.lm === "1"}
        />
      </Suspense>
    );
  }

  // First load (no URL param) → need DB for view + config
  const sessionUser = await getSessionUser();
  const config = sessionUser?.email ? await getUserViewConfig(sessionUser.email) : null;

  const view = urlView ?? (config?.dashboardView ?? "OVERVIEW");

  if (view === "FOCUS") {
    const mineFilter = params.lm !== undefined ? (params.lm === "1") : (config?.assignedToMeOnly ?? false);
    let assignedToUserId: number | undefined;
    if (mineFilter && sessionUser?.email) assignedToUserId = await resolveAssignedToUserId(sessionUser.email);
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <FocusDashboard
          assignedToUserId={assignedToUserId}
          favoritesOnly={params.lf !== undefined ? params.lf === "1" : (config?.favoritesOnly ?? false)}
          tracingFilter={params.lt ? params.lt.split(",").filter(Boolean) : ((config?.tracingFilter as string[]) ?? [])}
          minPriority={params.lp !== undefined ? (params.lp || null) : ((config?.minPriority as string | null) ?? null)}
          initialMine={mineFilter}
        />
      </Suspense>
    );
  }

  const mineFilter = params.lm !== undefined ? (params.lm === "1") : (config?.assignedToMeOnly ?? false);
  const favFilter = params.lf !== undefined ? (params.lf === "1") : (config?.favoritesOnly ?? false);
  let overviewAssignedToUserId: number | undefined;
  if (mineFilter && sessionUser?.email) overviewAssignedToUserId = await resolveAssignedToUserId(sessionUser.email);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <OverviewDashboard
        assignedToUserId={overviewAssignedToUserId}
        favoritesOnly={favFilter}
        initialMine={mineFilter}
      />
    </Suspense>
  );
}
