import { RecordForm } from "@/components/records/record-form";
import prisma from "@/lib/prisma";

export default async function CreateRecordPage() {
  const districts = await prisma.district.findMany({
    include: {
      Court: {
        include: {
          Office: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <RecordForm districts={districts} />
    </div>
  );
}
