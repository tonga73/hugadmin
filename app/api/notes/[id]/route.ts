import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener una nota específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const note = await prisma.note.findUnique({
      where: { id: parseInt(id) },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Nota no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json(
      { error: "Error al obtener nota" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar nota
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, text } = body;

    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(text !== undefined && { text }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "Error al actualizar nota" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar nota
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    await prisma.note.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Error al eliminar nota" },
      { status: 500 }
    );
  }
}

