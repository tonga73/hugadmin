import prisma from "@/lib/prisma";

async function main() {
  const withDots = await prisma.record.findMany({
    where: { order: { contains: "." } },
    select: {
      id: true,
      order: true,
      _count: { select: { Note: true } },
    },
  });

  const toDelete: number[] = [];
  const skipped: { conPuntoId: number; sinPuntoId: number; order: string; reason: string }[] = [];

  for (const r of withDots) {
    const normalized = r.order.replace(/\./g, "");
    const twin = await prisma.record.findUnique({
      where: { order: normalized },
      select: { id: true, _count: { select: { Note: true } } },
    });

    if (!twin) continue;

    if (twin._count.Note === 0) {
      toDelete.push(twin.id);
    } else {
      skipped.push({
        conPuntoId: r.id,
        sinPuntoId: twin.id,
        order: r.order,
        reason: `SIN PUNTO id=${twin.id} tiene ${twin._count.Note} nota(s)`,
      });
    }
  }

  console.log(`\n→ A eliminar (SIN PUNTO sin notas): ${toDelete.length}`);
  console.log(`→ A saltear (requieren revisión manual): ${skipped.length}\n`);

  // Eliminar en orden: primero notas y relaciones, luego el record
  let deleted = 0;
  for (const id of toDelete) {
    await prisma.note.deleteMany({ where: { recordId: id } });
    await prisma.recordsAndUser.deleteMany({ where: { recordId: id } });
    await prisma.record.delete({ where: { id } });
    console.log(`  ✅ Eliminado id=${id}`);
    deleted++;
  }

  console.log(`\n✅ Eliminados: ${deleted}`);

  if (skipped.length > 0) {
    console.log(`\n⚠️  Pendientes de revisión manual (${skipped.length}):`);
    skipped.forEach((s) =>
      console.log(`  "${s.order}" → CON PUNTO id=${s.conPuntoId} / SIN PUNTO id=${s.sinPuntoId} — ${s.reason}`)
    );
  }
}

main().finally(() => prisma.$disconnect());
