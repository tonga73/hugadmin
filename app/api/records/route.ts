import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { Priority, Tracing } from "@/app/generated/prisma/enums";

// Schema de validación para POST - CORREGIDO: agregado officeId
const createRecordSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  order: z.string().min(1, "El orden es requerido"),
  tracing: z.nativeEnum(Tracing),
  priority: z.nativeEnum(Priority),
  code: z.string().optional(),
  insurance: z.array(z.string()).optional(),
  defendant: z.array(z.string()).optional(),
  prosecutor: z.array(z.string()).optional(),
  officeId: z.number().nullable().optional(), // ← AGREGADO
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cursorParam = searchParams.get("cursor");
    const cursor = cursorParam ? Number(cursorParam) : undefined;
    const take = 10;

    const records = await prisma.record.findMany({
      take,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { id: "asc" },
      include: {
        Office: {
          include: {
            Court: {
              include: {
                District: true,
              },
            },
          },
        },
      },
    });

    const nextCursor =
      records.length === take ? records[records.length - 1].id : null;

    return NextResponse.json({
      records,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching records:", error);
    return NextResponse.json(
      { error: "Error al obtener los registros" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Body recibido:", body); // Debug

    // Validar datos
    const validatedData = createRecordSchema.parse(body);

    console.log("Datos validados:", validatedData); // Debug

    const now = new Date();

    const newRecord = await prisma.record.create({
      data: {
        ...validatedData,
        createdAt: now,
        updatedAt: now,
      },
      include: {
        Office: {
          include: {
            Court: {
              include: {
                District: true,
              },
            },
          },
        },
      },
    });

    console.log("Record creado:", newRecord); // Debug

    // Invalida la cache (Next.js 15)
    revalidateTag("records", "default");

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    console.error("Error creating record:", error);
    return NextResponse.json(
      { error: "Error al crear el registro" },
      { status: 500 }
    );
  }
}
