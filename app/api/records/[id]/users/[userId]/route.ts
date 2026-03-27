import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    await prisma.recordsAndUser.delete({
      where: {
        recordId_userId: { recordId: Number(id), userId: Number(userId) },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error unassigning user:", error);
    return NextResponse.json({ error: "Error al desasignar usuario" }, { status: 500 });
  }
}
