import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { id: true, email: true, name: true, image: true, role: true },
  });
  if (!user)
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const data: { name?: string; image?: string | null } = {};

  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if ("image" in body) {
    data.image = typeof body.image === "string" && body.image.trim() ? body.image.trim() : null;
  }

  const user = await prisma.user.update({
    where: { email: sessionUser.email },
    data,
    select: { id: true, email: true, name: true, image: true, role: true },
  });

  return NextResponse.json(user);
}
