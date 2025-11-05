"use client";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaGoogle, FaSpinner } from "react-icons/fa";
import { Button } from "../ui/button";

export const LoginButton: React.FC = () => {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const profile = await signInWithGoogle();
      console.log("Usuario logueado:", profile);

      router.push("/");
      router.refresh();
    } catch (error: any) {
      console.error("Error al iniciar sesión:", error);
      alert("Error al iniciar sesión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="lg" onClick={handleLogin} disabled={loading}>
      {loading ? (
        <>
          <FaSpinner className="animate-spin" />
          Cargando...
        </>
      ) : (
        <>
          <FaGoogle />
          Iniciar sesión con Google
        </>
      )}
    </Button>
  );
};
