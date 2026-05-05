import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { createNotifications } from "@/lib/notifications";
import { logActivity } from "@/lib/record-activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rows = await prisma.recordsAndUser.findMany({
    where: { recordId: Number(id) },
    include: { User: { select: { id: true, name: true, email: true, image: true } } },
  });
  return NextResponse.json(rows.map((r) => r.User));
}

const assignSchema = z.object({
  userIds: z.array(z.number().int().positive()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordId = Number(id);
    const body = await req.json();
    const { userIds } = assignSchema.parse(body);

    const [session, record] = await Promise.all([
      getSessionUser(),
      prisma.record.findUnique({ where: { id: recordId }, select: { order: true, name: true } }),
    ]);
    const me = session?.email
      ? await prisma.user.findUnique({ where: { email: session.email }, select: { id: true } })
      : null;

    await prisma.recordsAndUser.createMany({
      data: userIds.map((userId) => ({ recordId, userId })),
      skipDuplicates: true,
    });

    if (record) {
      // Fetch names for audit log
      const assignedUsers = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      });
      await Promise.all(
        assignedUsers.map((u) =>
          logActivity({
            recordId,
            userId: me?.id,
            action: "user_assigned",
            newValue: u.name ?? u.email,
          })
        )
      );

      const targetIds = userIds.filter((uid) => uid !== me?.id);
      await createNotifications(targetIds, {
        type: "RECORD_ASSIGNED",
        title: "Te asignaron a un expediente",
        body: `${record.order} — ${record.name}`,
        entityId: recordId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("Error assigning users:", error);
    return NextResponse.json({ error: "Error al asignar usuarios" }, { status: 500 });
  }
}
