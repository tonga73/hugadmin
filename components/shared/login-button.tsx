"use client";

import { useAuth } from "@/contexts/auth-context";
import { useState } from "react";

export default function LoginButton() {
  const { signInWithGoogle, user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      console.log("Usuario logueado:", profile);
    } catch (error) {
      alert("Error al iniciar sesión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      alert("Error al cerrar sesión: " + error.message);
    }
  };

  if (user) {
    return (
      <div>
        <p>Bienvenido, {user.displayName}</p>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    );
  }

  return (
    <button onClick={handleLogin} disabled={loading}>
      {loading ? "Cargando..." : "Iniciar sesión con Google"}
    </button>
  );
}
