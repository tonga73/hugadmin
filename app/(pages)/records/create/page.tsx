"use client";
import { RecordForm, RecordFormValues } from "@/components/records/record-form";
import { useRouter } from "next/navigation";

export default function CreateRecordPage() {
  const router = useRouter();
  const handleSubmit = async (data: RecordFormValues) => {
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const newRecord = await res.json();

    // 🔹 notificar al sidebar
    window.dispatchEvent(new CustomEvent("new-record", { detail: newRecord }));

    router.push(`/records/${newRecord.id}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Crear nuevo expediente</h1>
      <RecordForm onSubmit={handleSubmit} />
    </div>
  );
}
