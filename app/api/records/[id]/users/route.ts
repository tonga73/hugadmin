import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

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

    await prisma.recordsAndUser.createMany({
      data: userIds.map((userId) => ({ recordId, userId })),
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("Error assigning users:", error);
    return NextResponse.json({ error: "Error al asignar usuarios" }, { status: 500 });
  }
}
