import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { AdminUserConfigForm } from "./admin-user-config-form";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    include: { viewConfig: true },
  });
  if (!user) notFound();

  return (
    <AdminUserConfigForm
      userId={user.id}
      userName={user.name ?? user.email}
      userEmail={user.email}
      userImage={user.image}
      initialConfig={{
        dashboardView: (user.viewConfig?.dashboardView ?? "OVERVIEW") as any,
        tracingFilter: (user.viewConfig?.tracingFilter as string[]) ?? [],
        favoritesOnly: user.viewConfig?.favoritesOnly ?? false,
        minPriority: (user.viewConfig?.minPriority as any) ?? null,
        fileCategories: (user.viewConfig?.fileCategories as any[]) ?? [],
      }}
    />
  );
}
