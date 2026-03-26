import prisma from "@/lib/prisma";

async function main() {
  // Contar cuántos tienen punto antes de migrar
  const before = await prisma.record.count({ where: { order: { contains: "." } } });
  console.log(`Records con punto antes: ${before}`);

  // SQL crudo: solo toca el campo "order", no dispara @updatedAt
  const result = await prisma.$executeRaw`
    UPDATE "Record"
    SET "order" = REPLACE("order", '.', '')
    WHERE "order" LIKE '%.%'
  `;
  console.log(`Rows afectadas: ${result}`);

  const after = await prisma.record.count({ where: { order: { contains: "." } } });
  console.log(`Records con punto después: ${after}`);
}

main().finally(() => prisma.$disconnect());
