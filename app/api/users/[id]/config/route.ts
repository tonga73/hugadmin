import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getUserViewConfigById } from "@/lib/user-config";
import { DashboardView, FileCategory, Priority, Tracing } from "@/app/generated/prisma/enums";

async function requireAdmin() {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: sessionUser.email },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? sessionUser : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const config = await getUserViewConfigById(Number(id));
  if (!config) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  return NextResponse.json(config);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const userId = Number(id);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (Array.isArray(body.tracingFilter)) {
    data.tracingFilter = body.tracingFilter.filter((v: string) =>
      Object.values(Tracing).includes(v as Tracing)
    );
  }
  if (typeof body.favoritesOnly === "boolean") {
    data.favoritesOnly = body.favoritesOnly;
  }
  if (body.minPriority === null || Object.values(Priority).includes(body.minPriority)) {
    data.minPriority = body.minPriority ?? null;
  }
  if (Array.isArray(body.fileCategories)) {
    data.fileCategories = body.fileCategories.filter((v: string) =>
      Object.values(FileCategory).includes(v as FileCategory)
    );
  }
  if (Object.values(DashboardView).includes(body.dashboardView)) {
    data.dashboardView = body.dashboardView;
  }

  const config = await prisma.userViewConfig.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return NextResponse.json(config);
}
