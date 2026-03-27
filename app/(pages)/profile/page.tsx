import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { name: true, image: true, email: true },
  });
  if (!user) redirect("/login");

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

      <ProfileForm
        initialName={user.name}
        initialImage={user.image}
        email={user.email}
      />
    </div>
  );
}
