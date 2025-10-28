// components/auth-loading.tsx
"use client";
import { useAuth } from "@/contexts/auth-context";
import { ReactNode } from "react";

export const AuthLoading: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
