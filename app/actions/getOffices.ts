"use server";

import prisma from "@/lib/prisma";

export async function getOffices() {
  const offices = await prisma.office.findMany({
    include: {
      Court: {
        include: {
          District: true,
        },
      },
    },
  });

  return { offices };
}
