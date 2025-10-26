import { Record } from "@/app/generated/prisma/client";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await prisma.record.findUniqueOrThrow({
    where: {
      id: Number(id),
    },
    include: {
      Office: {
        include: {
          Court: {
            include: {
              District: true,
            },
          },
        },
      },
    },
  });

  if (!record) return <div>No se ha encontrado ese expediente.</div>;

  const { Office: RecordOffice } = record;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{record.order}</CardTitle>
          <CardDescription>{record.name}</CardDescription>
          <CardAction>action</CardAction>
        </CardHeader>
        <CardContent>
          <p>{record.defendant}</p>
          <p>{record.prosecutor}</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{RecordOffice?.Court?.name}</CardTitle>
          <CardDescription>
            {"Secretaría " +
              RecordOffice?.name +
              " | " +
              RecordOffice?.Court?.District?.name +
              " Circunscripción"}
          </CardDescription>
          <CardAction>action</CardAction>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    </div>
  );
}
