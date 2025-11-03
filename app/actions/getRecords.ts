"use server";

import prisma from "@/lib/prisma";

export async function getRecords({
  cursor,
  take = 10,
}: {
  cursor?: number;
  take?: number;
}) {
  const records = await prisma.record.findMany({
    take,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { updatedAt: "desc" },
  });

  const lastId = records.at(-1)?.id ?? null;
  const hasMore = records.length === take;

  return { records, lastId, hasMore };
}
