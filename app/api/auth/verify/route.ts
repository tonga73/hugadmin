// app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // ✅ Parsear los datos de la cookie
    const sessionData = JSON.parse(sessionCookie.value);

    // Verificar que no haya expirado (opcional)
    const age = Date.now() - sessionData.createdAt;
    const maxAge = 60 * 60 * 24 * 5 * 1000; // 5 días

    if (age > maxAge) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: sessionData.user,
    });
  } catch (error) {
    console.error("Error verificando sesión:", error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
