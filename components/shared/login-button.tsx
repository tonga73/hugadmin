"use client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const LoginButton: React.FC = () => {
  const router = useRouter();
  const { signInWithGoogle, user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      console.log("Usuario logueado:", profile);

      // ✅ Redirigir a la página principal después del login
      router.push("/");
      router.refresh(); // Refrescar para que el middleware actualice
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al iniciar sesión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();

      // ✅ Redirigir al login después de cerrar sesión
      router.push("/login");
      router.refresh();
    } catch (error: any) {
      console.error("Error al cerrar sesión:", error);
      alert("Error al cerrar sesión: " + error.message);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <p>Bienvenido, {user.displayName}</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? "Cargando..." : "Iniciar sesión con Google"}
    </button>
  );
};
