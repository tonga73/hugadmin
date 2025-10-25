import prisma from "@/lib/prisma";

export default async function Home() {
  const records = await prisma.record.findMany();
  return (
    <div>
      {records.map((record, index) => (
        <p key={index}>{record.name}</p>
      ))}
    </div>
  );
}
