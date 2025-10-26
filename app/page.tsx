import { ModeToggle } from "@/components/shared/mode-toggle";
import prisma from "@/lib/prisma";

export default async function Home() {
  const records = await prisma.record.findMany();
  return (
    <div className="h-screen grid grid-flow-col">
      <div className="col-span-3">SIDEBAR</div>

      <div className="col-span-9">
        MAIN
        <ModeToggle />
      </div>
    </div>
  );
}
