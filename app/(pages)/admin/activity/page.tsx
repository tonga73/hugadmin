import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ActivityPageClient } from "./activity-page-client";

export default async function AdminActivityPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") redirect("/");

  const LIMIT = 25;

  const [activityRaw, users] = await Promise.all([
    prisma.recordActivity.findMany({
      orderBy: { id: "desc" },
      take: LIMIT + 1,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        record: { select: { id: true, name: true, order: true } },
      },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasMore = activityRaw.length > LIMIT;
  const activityItems = hasMore ? activityRaw.slice(0, LIMIT) : activityRaw;
  const nextCursor = hasMore ? activityItems[activityItems.length - 1].id : null;

  const initialActivity = activityItems.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold">Actividad global</h1>
          </div>
        </div>

        <ActivityPageClient
          initialItems={initialActivity}
          initialNextCursor={nextCursor}
          users={users}
        />
      </div>
    </div>
  );
}
