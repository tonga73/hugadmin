import prisma from "@/lib/prisma";

async function main() {
  // ── 1. Pares duplicados ──────────────────────────────────────────────────
  const withDots = await prisma.record.findMany({
    where: { order: { contains: "." } },
    select: {
      id: true,
      order: true,
      name: true,
      tracing: true,
      updatedAt: true,
      _count: { select: { Note: true, files: true } },
    },
  });

  if (withDots.length > 0) {
    console.log(`\n━━━ DUPLICADOS (${withDots.length} con punto que colisionan) ━━━\n`);

    for (const r of withDots) {
      const normalized = r.order.replace(/\./g, "");
      const twin = await prisma.record.findUnique({
        where: { order: normalized },
        select: {
          id: true,
          order: true,
          name: true,
          tracing: true,
          updatedAt: true,
          _count: { select: { Note: true, files: true } },
        },
      });

      if (!twin) continue;

      console.log(`  CON PUNTO  id=${r.id.toString().padEnd(4)} "${r.order.padEnd(18)}" | ${r.tracing.padEnd(30)} | notas=${r._count.Note} archivos=${r._count.files} | ${r.updatedAt.toISOString().slice(0, 10)}`);
      console.log(`  SIN PUNTO  id=${twin.id.toString().padEnd(4)} "${twin.order.padEnd(18)}" | ${twin.tracing.padEnd(30)} | notas=${twin._count.Note} archivos=${twin._count.files} | ${twin.updatedAt.toISOString().slice(0, 10)}`);
      console.log(`  → Eliminar: /records/${r.id} o /records/${twin.id}\n`);
    }
  } else {
    console.log("\n✅ Sin duplicados pendientes.");
  }

  // ── 2. Registros con guión en lugar de barra ─────────────────────────────
  const withDash = await prisma.record.findMany({
    where: {
      AND: [
        { order: { contains: "-" } },
        { order: { not: { contains: "/" } } },
      ],
    },
    select: { id: true, order: true, name: true },
    orderBy: { order: "asc" },
  });

  console.log(`\n━━━ GUIÓN EN LUGAR DE BARRA (${withDash.length}) ━━━\n`);
  if (withDash.length === 0) {
    console.log("  Ninguno.");
  } else {
    withDash.forEach((r) =>
      console.log(`  id=${r.id.toString().padEnd(4)} "${r.order.padEnd(20)}" ${r.name.slice(0, 50)}`)
    );
  }
}

main().finally(() => prisma.$disconnect());
