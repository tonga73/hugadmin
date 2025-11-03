"use client";
import { RecordForm, RecordFormValues } from "@/components/records/record-form";

interface EditRecordPageProps {
  record: RecordFormValues & { id: number }; // incluimos id aparte
}

export default function EditRecordPage({ record }: EditRecordPageProps) {
  const handleSubmit = async (data: RecordFormValues) => {
    // Usamos record.id que viene como prop
    await fetch(`/api/records/${record.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Editar expediente</h1>
      <RecordForm defaultValues={record} onSubmit={handleSubmit} />
    </div>
  );
}
