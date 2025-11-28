import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Obtener notas de un record
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("recordId");

  if (!recordId) {
    return NextResponse.json(
      { error: "recordId es requerido" },
      { status: 400 }
    );
  }

  try {
    const notes = await prisma.note.findMany({
      where: { recordId: parseInt(recordId) },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Error al obtener notas" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva nota
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordId, name, text } = body;

    if (!recordId || !text) {
      return NextResponse.json(
        { error: "recordId y text son requeridos" },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        recordId: parseInt(recordId),
        name: name || null,
        text,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Error al crear nota" },
      { status: 500 }
    );
  }
}
