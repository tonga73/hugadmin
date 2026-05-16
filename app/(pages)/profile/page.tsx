import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { UserActivitySection } from "./user-activity-section";

export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true, name: true, image: true, email: true },
  });
  if (!user) redirect("/login");

  const LIMIT = 25;
  const activityRaw = await prisma.recordActivity.findMany({
    where: { userId: user.id },
    orderBy: { id: "desc" },
    take: LIMIT + 1,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      record: { select: { id: true, name: true, order: true } },
    },
  });

  const hasMore = activityRaw.length > LIMIT;
  const activityItems = hasMore ? activityRaw.slice(0, LIMIT) : activityRaw;
  const nextCursor = hasMore ? activityItems[activityItems.length - 1].id : null;

  const initialActivity = activityItems.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-sm font-semibold text-foreground">Perfil</h1>
        </div>
      </div>

      <div className="space-y-4">
        <ProfileForm
          initialName={user.name}
          initialImage={user.image}
          email={user.email}
        />
        <UserActivitySection
          initialItems={initialActivity}
          initialNextCursor={nextCursor}
        />
      </div>
    </div>
  );
}
