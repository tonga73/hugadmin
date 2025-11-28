// contexts/auth-context.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Evitar doble inicialización en StrictMode
    if (initializedRef.current) return;
    initializedRef.current = true;

    let isMounted = true;

    const initAuth = async () => {
      // 1. Primero verificar si hay sesión en el servidor (cookie)
      try {
        const response = await fetch("/api/auth/verify");
        if (response.ok) {
          const data = await response.json();
          if (data.user && isMounted) {
            setUser(data.user);
            setLoading(false);
            return; // Sesión válida, no necesitamos Firebase
          }
        }
      } catch (e) {
        console.error("Error verificando sesión:", e);
      }

      // 2. Si no hay sesión en servidor, escuchar Firebase
      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser: FirebaseUser | null) => {
          if (!isMounted) return;

          if (firebaseUser) {
            // Firebase tiene usuario - intentar crear/restaurar sesión
            try {
              const idToken = await firebaseUser.getIdToken();
              const userProfile: AuthUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
              };

              const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken, user: userProfile }),
              });

              if (response.ok && isMounted) {
                setUser(userProfile);
              }
            } catch (error) {
              console.error("Error sincronizando sesión:", error);
            }
          } else {
            // Firebase no tiene usuario - limpiar estado
            if (isMounted) {
              setUser(null);
            }
          }

          if (isMounted) {
            setLoading(false);
          }
        }
      );

      return () => {
        unsubscribe();
      };
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Verificar sesión cuando la ventana recupera el foco
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && user) {
        try {
          const response = await fetch("/api/auth/verify");
          if (!response.ok) {
            // Sesión expirada - limpiar
            setUser(null);
            await firebaseSignOut(auth);
            await fetch("/api/auth/session", { method: "DELETE" });
          }
        } catch {
          // Ignorar errores de red
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  const signInWithGoogle = async (): Promise<AuthUser> => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const profile: AuthUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
    };

    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, user: profile }),
    });

    if (!response.ok) throw new Error("Error creando sesión");

    setUser(profile);
    return profile;
  };

  const signOut = async (): Promise<void> => {
    await fetch("/api/auth/session", { method: "DELETE" });
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
