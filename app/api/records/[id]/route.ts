import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { Priority, Tracing } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";

// Schema de validación para PATCH
const updateRecordSchema = z.object({
  code: z.string().optional(),
  order: z.string().min(1, "El orden es requerido").optional(),
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .optional(),
  insurance: z.array(z.string()).optional(), // Array de strings
  defendant: z.array(z.string()).optional(),
  prosecutor: z.array(z.string()).optional(),
  tracing: z.nativeEnum(Tracing).optional(),
  priority: z.nativeEnum(Priority).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.record.findUniqueOrThrow({
      where: { id: Number(id) },
      include: {
        Note: true,
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

    return NextResponse.json(record);
  } catch (error) {
    console.error("Error fetching record:", error);
    return NextResponse.json(
      { error: "Registro no encontrado" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validar datos
    const validatedData = updateRecordSchema.parse(body);

    // Preparar data para Prisma con el tipo correcto
    const updateData: Prisma.RecordUpdateInput = {
      updatedAt: new Date(),
    };

    // Solo agregar campos que vienen en la request
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.order !== undefined)
      updateData.order = validatedData.order;
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.insurance !== undefined)
      updateData.insurance = validatedData.insurance;
    if (validatedData.defendant !== undefined)
      updateData.defendant = validatedData.defendant;
    if (validatedData.prosecutor !== undefined)
      updateData.prosecutor = validatedData.prosecutor;
    if (validatedData.tracing !== undefined)
      updateData.tracing = validatedData.tracing;
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority;

    // Actualizar en base de datos
    const updated = await prisma.record.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        Note: true,
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

    // Invalida cache (Next.js 15)
    revalidateTag("records", "default");
    revalidateTag(`record-${id}`, "default");

    return NextResponse.json(updated);
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

    console.error("Error updating record:", error);
    return NextResponse.json(
      { error: "Error al actualizar el registro" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.record.delete({
      where: { id: Number(id) },
    });

    // Invalida cache (Next.js 15)
    revalidateTag("records", "default");
    revalidateTag(`record-${id}`, "default");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { error: "Error al eliminar el registro" },
      { status: 500 }
    );
  }
}
