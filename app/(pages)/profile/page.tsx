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
    select: { id: true, name: true, image: true, email: true, role: true },
  });
  if (!user) redirect("/login");

  const LIMIT = 25;
  const [activityRaw, totalCount] = await Promise.all([
    prisma.recordActivity.findMany({
      where: { userId: user.id },
      orderBy: { id: "desc" },
      take: LIMIT + 1,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        record: { select: { id: true, name: true, order: true } },
      },
    }),
    prisma.recordActivity.count({ where: { userId: user.id } }),
  ]);

  const hasMore = activityRaw.length > LIMIT;
  const activityItems = hasMore ? activityRaw.slice(0, LIMIT) : activityRaw;
  const nextCursor = hasMore ? activityItems[activityItems.length - 1].id : null;

  const initialActivity = activityItems.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-sm font-semibold text-foreground">Perfil</h1>
      </div>

      {/* Layout: dos columnas en desktop, apilado en móvil */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        {/* Columna izquierda: perfil */}
        <div className="lg:w-72 shrink-0">
          <ProfileForm
            initialName={user.name}
            initialImage={user.image}
            email={user.email}
            role={user.role}
          />
        </div>

        {/* Columna derecha: actividad — scrollea independientemente */}
        <UserActivitySection
          initialItems={initialActivity}
          initialNextCursor={nextCursor}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
}
