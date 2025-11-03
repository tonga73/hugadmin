import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursorParam = searchParams.get("cursor");
  const cursor = cursorParam ? Number(cursorParam) : undefined;

  const take = 10;

  const records = await prisma.record.findMany({
    take,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { id: "asc" },
  });

  // 🔁 Si quisieras invalidar cache cuando cambia algo:
  // revalidateTag("records");

  return NextResponse.json({ records });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, order, tracing, priority } = body;

  const now = new Date();

  const newRecord = await prisma.record.create({
    data: {
      name,
      order,
      tracing,
      priority,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 🔹 invalida la cache de la lista
  revalidateTag("records", "all");

  return NextResponse.json(newRecord, { status: 201 });
}
