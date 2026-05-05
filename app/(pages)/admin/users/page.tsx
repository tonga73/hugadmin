import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UsersList } from "./users-list";

export default async function AdminUsersPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { role: true },
  });
  if (currentUser?.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { viewConfig: true },
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold">Usuarios</h1>
            <p className="text-sm text-muted-foreground">{users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}.</p>
          </div>
        </div>

        <UsersList users={users} />
      </div>
    </div>
  );
}
