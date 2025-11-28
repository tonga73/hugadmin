// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  
  try {
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Parsear los datos de la cookie
    let sessionData;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch {
      // Cookie corrupta, eliminar
      cookieStore.delete("session");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verificar que tenga los datos necesarios
    if (!sessionData.user || !sessionData.createdAt) {
      cookieStore.delete("session");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verificar que no haya expirado
    const age = Date.now() - sessionData.createdAt;
    const maxAge = 60 * 60 * 24 * 5 * 1000; // 5 días

    if (age > maxAge) {
      // Sesión expirada, eliminar cookie
      cookieStore.delete("session");
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: sessionData.user,
      expiresIn: maxAge - age, // Tiempo restante en ms
    });
  } catch (error) {
    console.error("Error verificando sesión:", error);
    // En caso de error, limpiar cookie
    try {
      cookieStore.delete("session");
    } catch {}
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
