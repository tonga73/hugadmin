import { NextResponse } from "next/server";
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

export async function GET() {
  const config = await prisma.config.findUnique({ where: { key: "maintenance_mode" } });
  return NextResponse.json({ enabled: config?.value === "true" });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { enabled } = await req.json();
  await prisma.config.upsert({
    where: { key: "maintenance_mode" },
    update: { value: enabled ? "true" : "false" },
    create: { key: "maintenance_mode", value: enabled ? "true" : "false" },
  });

  return NextResponse.json({ enabled });
}
