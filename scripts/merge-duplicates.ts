import prisma from "@/lib/prisma";

async function main() {
  const withDots = await prisma.record.findMany({
    where: { order: { contains: "." } },
    select: {
      id: true,
      order: true,
      createdAt: true,
      _count: { select: { Note: true } },
    },
  });

  let merged = 0;

  for (const r of withDots) {
    const normalized = r.order.replace(/\./g, "");
    const twin = await prisma.record.findUnique({
      where: { order: normalized },
      select: {
        id: true,
        createdAt: true,
        _count: { select: { Note: true } },
      },
    });

    if (!twin) continue;

    // Decidir cuál conservar: más notas gana; empate → más nuevo gana
    let keepId: number;
    let deleteId: number;

    if (r._count.Note !== twin._count.Note) {
      keepId = r._count.Note > twin._count.Note ? r.id : twin.id;
      deleteId = keepId === r.id ? twin.id : r.id;
    } else {
      keepId = r.createdAt > twin.createdAt ? r.id : twin.id;
      deleteId = keepId === r.id ? twin.id : r.id;
    }

    // Transferir notas del que se elimina al que queda
    const transferred = await prisma.note.updateMany({
      where: { recordId: deleteId },
      data: { recordId: keepId },
    });

    // Eliminar relaciones y el record
    await prisma.recordsAndUser.deleteMany({ where: { recordId: deleteId } });
    await prisma.record.delete({ where: { id: deleteId } });

    console.log(`  ✅ "${r.order}" → conservado id=${keepId}, eliminado id=${deleteId}, notas transferidas=${transferred.count}`);
    merged++;
  }

  console.log(`\n✅ Pares mergeados: ${merged}`);
}

main().finally(() => prisma.$disconnect());
