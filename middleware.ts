import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value; // ✅ Cookie de Firebase
  const { pathname } = request.nextUrl;

  console.log("🔍 Middleware - Path:", pathname);
  console.log("🔍 Middleware - Session exists:", !!session);
  console.log("🍪 Todas las cookies:", request.cookies.getAll());

  // Si estás en login y tienes sesión, ir a home
  if (pathname === "/login" && session) {
    console.log("✅ Redirigiendo a / (tiene sesión)");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si no estás en login y no tienes sesión, ir a login
  if (pathname !== "/login" && !session) {
    console.log("❌ Redirigiendo a /login (sin sesión)");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log("✅ Permitiendo acceso");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
