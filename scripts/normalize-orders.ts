import prisma from "@/lib/prisma";

async function main() {
  // Traer todos los records con punto
  const withDots = await prisma.record.findMany({
    where: { order: { contains: "." } },
    select: { id: true, order: true },
  });
  console.log(`Records con punto: ${withDots.length}`);

  const conflicts: { id: number; order: string; normalized: string }[] = [];
  let updated = 0;

  for (const r of withDots) {
    const normalized = r.order.replace(/\./g, "");

    // Verificar si el valor normalizado ya existe en otro record
    const existing = await prisma.record.findUnique({ where: { order: normalized } });
    if (existing && existing.id !== r.id) {
      conflicts.push({ id: r.id, order: r.order, normalized });
      continue;
    }

    // Actualizar sin tocar updatedAt
    await prisma.$executeRaw`
      UPDATE "Record" SET "order" = ${normalized} WHERE "id" = ${r.id}
    `;
    updated++;
  }

  console.log(`\n✅ Actualizados: ${updated}`);

  if (conflicts.length > 0) {
    console.log(`\n⚠️  Duplicados salteados (${conflicts.length}) — requieren revisión manual:`);
    conflicts.forEach((c) =>
      console.log(`  id=${c.id}  "${c.order}"  →  "${c.normalized}" (ya existe)`)
    );
  }

  const after = await prisma.record.count({ where: { order: { contains: "." } } });
  console.log(`\nRecords con punto restantes: ${after}`);
}

main().finally(() => prisma.$disconnect());
