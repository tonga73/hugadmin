"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation"; // o 'next/router' en Pages Router
import { useEffect } from "react";

export const ProtectedRoute: React.FC = ({ children }: any) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
