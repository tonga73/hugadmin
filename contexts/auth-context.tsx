// contexts/auth-context.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
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

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      console.log("🚀 Inicializando auth...");

      // Primero verificar si hay sesión en el servidor
      const hasCookie = document.cookie.includes("session=");
      console.log("🍪 Cookie exists:", hasCookie);

      if (hasCookie) {
        try {
          const response = await fetch("/api/auth/verify");

          if (response.ok && isMounted) {
            const data = await response.json();
            console.log("✅ Sesión válida del servidor:", data.user);
            setUser(data.user);
            setLoading(false);
            return; // Ya tenemos el usuario, no necesitamos esperar a Firebase
          } else {
            console.log("⚠️ Sesión inválida, limpiando...");
            await fetch("/api/auth/session", { method: "DELETE" });
          }
        } catch (error) {
          console.error("❌ Error verificando sesión:", error);
        }
      }

      // Si no hay sesión válida, escuchar cambios de Firebase
      console.log("👂 Escuchando cambios de Firebase...");

      const unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser: FirebaseUser | null) => {
          if (!isMounted) return;

          console.log("🔥 Firebase auth changed:", firebaseUser?.uid || "null");

          if (firebaseUser) {
            const cookieExists = document.cookie.includes("session=");

            if (!cookieExists) {
              console.log("📝 Nuevo login, creando sesión...");
              const idToken = await firebaseUser.getIdToken();

              try {
                const userProfile = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                };

                const response = await fetch("/api/auth/session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    idToken,
                    user: userProfile,
                  }),
                });

                if (!response.ok) throw new Error("Error creando sesión");

                if (isMounted) {
                  setUser(userProfile);
                }
              } catch (error) {
                console.error("❌ Error creando sesión:", error);
                await firebaseSignOut(auth);
                if (isMounted) {
                  setUser(null);
                }
              }
            }
          } else {
            const cookieExists = document.cookie.includes("session=");
            if (!cookieExists && isMounted) {
              setUser(null);
            }
          }

          if (isMounted) {
            setLoading(false);
          }
        }
      );

      return unsubscribe;
    };

    const unsubscribePromise = initAuth();

    return () => {
      isMounted = false;
      unsubscribePromise.then((unsub) => unsub && unsub());
    };
  }, []);

  const signInWithGoogle = async (): Promise<AuthUser> => {
    try {
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
        body: JSON.stringify({
          idToken,
          user: profile,
        }),
      });

      if (!response.ok) throw new Error("Error creando sesión");

      setUser(profile);
      return profile;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
