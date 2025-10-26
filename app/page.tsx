import { ModeToggle } from "@/components/shared";
import prisma from "@/lib/prisma";

export default async function Home() {
  const records = await prisma.record.findMany();
  return <div className="">ola</div>;
}
