import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { Priority, Tracing } from "@/app/generated/prisma/enums";
import { Prisma } from "@/app/generated/prisma/client";
import { normalizeOrder, validateOrderYear } from "@/lib/record-number";
import { getSessionUser } from "@/lib/session";
import { createNotifications } from "@/lib/notifications";
import { logActivity } from "@/lib/record-activity";

// Schema de validación para PATCH
const updateRecordSchema = z.object({
  code: z.string().optional(),
  order: z.string().min(1, "El orden es requerido").optional().refine(
    (val) => val === undefined || validateOrderYear(val) === null,
    "El formato debe ser número/año con 4 dígitos (ej: 12345/2024)"
  ),
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .optional(),
  insurance: z.array(z.string()).optional(),
  defendant: z.array(z.string()).optional(),
  prosecutor: z.array(z.string()).optional(),
  tracing: z.nativeEnum(Tracing).optional(),
  priority: z.nativeEnum(Priority).optional(),
  favorite: z.boolean().optional(),
  archive: z.boolean().optional(),
  officeId: z.number().nullable().optional(),
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
        files: { orderBy: { createdAt: "desc" } },
        Office: {
          include: {
            Court: {
              include: {
                District: true,
              },
            },
          },
        },
        RecordsAndUser: {
          include: {
            User: { select: { id: true, name: true, email: true, image: true } },
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
      updateData.order = normalizeOrder(validatedData.order);
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
    if (validatedData.favorite !== undefined)
      updateData.favorite = validatedData.favorite;
    if (validatedData.archive !== undefined)
      updateData.archive = validatedData.archive;
    if (validatedData.officeId !== undefined) {
      updateData.Office = validatedData.officeId
        ? { connect: { id: validatedData.officeId } }
        : { disconnect: true };
    }

    // Fetch current state for audit log
    const session = await getSessionUser().catch(() => null);
    const me = session?.email
      ? await prisma.user.findUnique({ where: { email: session.email }, select: { id: true } })
      : null;

    const current = await prisma.record.findUnique({
      where: { id: Number(id) },
      select: { order: true, name: true, tracing: true, priority: true },
    });

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

    // Invalida cache
    revalidateTag("records", "default");

    // Audit log
    if (current) {
      const loggableFields: Array<[string, string, string]> = [
        ["tracing", current.tracing, updated.tracing],
        ["priority", current.priority, updated.priority],
        ["name", current.name, updated.name],
        ["order", current.order, updated.order],
      ];
      await Promise.all(
        loggableFields
          .filter(([, oldV, newV]) => oldV !== newV)
          .map(([field, oldValue, newValue]) =>
            logActivity({ recordId: Number(id), userId: me?.id, action: "field_updated", field, oldValue, newValue })
          )
      );
    }

    // Notify assignees of significant changes (tracing or priority)
    if (validatedData.tracing !== undefined || validatedData.priority !== undefined) {
      const session = await getSessionUser().catch(() => null);
      const me = session?.email
        ? await prisma.user.findUnique({ where: { email: session.email }, select: { id: true } })
        : null;

      const assignees = await prisma.recordsAndUser.findMany({
        where: { recordId: Number(id) },
        select: { userId: true },
      });
      const recipientIds = assignees
        .map((a) => a.userId)
        .filter((uid) => uid !== me?.id);

      if (recipientIds.length > 0) {
        await createNotifications(recipientIds, {
          type: "RECORD_UPDATED",
          title: "Expediente actualizado",
          body: `${updated.order} — ${updated.name}`,
          entityId: Number(id),
        });
      }
    }

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
    const recordId = Number(id);

    // Primero eliminar las notas asociadas
    await prisma.note.deleteMany({
      where: { recordId },
    });

    // Luego eliminar el record
    await prisma.record.delete({
      where: { id: recordId },
    });

    // Invalida cache
    revalidateTag("records", "default");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { error: "Error al eliminar el registro" },
      { status: 500 }
    );
  }
}
