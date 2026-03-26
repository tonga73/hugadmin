"use client";

import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

function getInitials(name: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-md mx-auto py-6 px-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Perfil</h1>
        </div>

        <Card className="p-4 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
            <AvatarFallback className="text-lg">{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user.displayName ?? "Sin nombre"}</p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </Card>

      </div>
    </div>
  );
}
