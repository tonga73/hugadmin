import { RecordForm } from "@/components/records/record-form";
import prisma from "@/lib/prisma";

export default async function CreateRecordPage() {
  const districts = await prisma.district.findMany({
    include: {
      Court: {
        include: {
          Office: true,
        },
      },
    },
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Crear nuevo expediente</h1>

      <RecordForm districts={districts} />
    </div>
  );
}
