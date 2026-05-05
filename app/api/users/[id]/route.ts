import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

async function requireAdmin() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? sessionUser : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const { name, role, active, visible } = body;

  const validRoles = ["USER", "ADMIN", "PART", "CLIENT"];
  if (role !== undefined && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(active !== undefined && { active, ...(active === false && { visible: false }) }),
      ...(active !== false && visible !== undefined && { visible }),
    },
    select: { id: true, name: true, email: true, role: true, active: true, visible: true },
  });

  return NextResponse.json(updated);
}
