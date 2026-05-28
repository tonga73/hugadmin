"use client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, ShieldCheck, Info, MapPin, Sparkles } from "lucide-react";
import { useAppTour } from "@/components/tour/app-tour";
import { APP_VERSION } from "@/app/constants/version";

export const UserMenu: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [imageLoading, setImageLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { startTour } = useAppTour();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (!user) return null;

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
    <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>hugadmin</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Versión <span className="font-mono font-medium text-foreground">v{APP_VERSION}</span></p>
          <p>Sistema de gestión de expedientes para estudio jurídico.</p>
          <p>
            Desarrollado por{" "}
            <a
              href="https://tonga73.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              gastoire
            </a>
            {" "}con el aporte técnico de Claudia.
          </p>
        </div>
      </DialogContent>
    </Dialog>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button id="tour-user-menu" className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Avatar>
            <AvatarImage
              src={user.photoURL || undefined}
              alt={user.displayName || "User"}
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Panel de admin</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/changelog")}>
          <Sparkles className="mr-2 h-4 w-4" />
          <span>Novedades</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => startTour()}
        >
          <MapPin className="mr-2 h-4 w-4" />
          <span>Recorrido guiado</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setAboutOpen(true)}>
          <Info className="mr-2 h-4 w-4" />
          <span>Acerca de</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
};
