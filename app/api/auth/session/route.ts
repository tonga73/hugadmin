// app/api/auth/session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { idToken, user } = await request.json();

    if (!idToken || !user) {
      return NextResponse.json(
        { error: "Token o usuario faltante" },
        { status: 400 }
      );
    }

    // ✅ Guardar token Y datos del usuario juntos
    const sessionData = JSON.stringify({
      token: idToken,
      user: user,
      createdAt: Date.now(),
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionData, {
      maxAge: 60 * 60 * 24 * 5, // 5 días
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Error al crear sesión" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("session");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Error al eliminar sesión" },
      { status: 500 }
    );
  }
}
