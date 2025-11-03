import { FaExclamation } from "react-icons/fa";
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
import { TracingBadge } from "@/components/records";

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
      Note: true,
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

  const { Note: RecordNote, Office: RecordOffice } = record;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex gap-3">
            {record.code?.length && (
              <>
                <p className="font-bold text-white/50 text-2xl">
                  {record.code}
                </p>
              </>
            )}
            <TracingBadge tracing={record.tracing} />
          </div>
          <CardTitle
            style={{
              fontWeight: "bolder",
              fontSize: "2.5rem",
            }}
          >
            {record.order}
          </CardTitle>
          <CardDescription
            style={{
              fontSize: "1.3rem",
            }}
          >
            {record.name}
          </CardDescription>
          <CardAction>
            <span>
              <FaExclamation />
            </span>
          </CardAction>
        </CardHeader>
        <CardContent></CardContent>
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
          <CardFooter>{record.insurance}</CardFooter>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/50 mb-0.5">Defensor</p>
          <ul className="border rounded-2xl p-1.5 text-sm text-white/50 space-y-1.5">
            {record.defendant.map((item, index) => (
              <li key={index}>- {item}</li>
            ))}
          </ul>

          <p className="text-sm text-white/50 mt-1.5">Actor</p>
          <ul className="border rounded-2xl p-1.5 text-sm text-white/50 space-y-1.5">
            {record.prosecutor.map((item, index) => (
              <li key={index}>- {item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-1.5 mt-3">
        <h3 className="text-2xl font-thin tracking-wide uppercase">Notas</h3>
        {RecordNote.map((note, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-white/50">
                {note.name || "Nota sin título"}
              </CardTitle>
            </CardHeader>
            <CardContent>{note.text}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
