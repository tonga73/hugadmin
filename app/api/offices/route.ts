import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Obtener todas las offices con sus relaciones
export async function GET() {
  try {
    const offices = await prisma.office.findMany({
      include: {
        Court: {
          include: {
            District: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(offices);
  } catch (error) {
    console.error("Error fetching offices:", error);
    return NextResponse.json(
      { error: "Error al obtener las oficinas" },
      { status: 500 }
    );
  }
}

