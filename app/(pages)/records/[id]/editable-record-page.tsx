"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FaExclamation } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TracingBadge } from "@/components/records";
import { EditableField } from "./editable-field";
import { EditableSelect } from "./editable-select";
import { EditableList } from "./editable-list";
import { toast } from "sonner";

// Schema de validación
const recordSchema = z.object({
  code: z.string().optional(),
  order: z.string().min(1, "Requerido"),
  name: z.string().min(3, "Mínimo 3 caracteres"),
  insurance: z.string().optional(),
  defendant: z.array(z.string()),
  prosecutor: z.array(z.string()),
  tracing: z.string(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface EditableRecordPageProps {
  record: any; // Tipea según tu Prisma schema
  tracingOptions: Record<string, { label: string; color?: string }>;
}

export default function EditableRecordPage({
  record,
  tracingOptions,
}: EditableRecordPageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { Note: RecordNote, Office: RecordOffice } = record;

  const {
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      code: record.code || "",
      order: record.order,
      name: record.name,
      insurance: record.insurance || "",
      defendant: record.defendant || [],
      prosecutor: record.prosecutor || [],
      tracing: record.tracing,
    },
  });

  const formValues = watch();

  // Función para guardar cambios
  const saveField = async (fieldName: keyof RecordFormValues, value: any) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: value }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      toast.success("Cambios guardados correctamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar los cambios"
      );
      // Revertir el cambio en el formulario
      setValue(fieldName, record[fieldName]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (fieldName: keyof RecordFormValues, value: any) => {
    setValue(fieldName, value);
    saveField(fieldName, value);
  };

  return (
    <div className="relative">
      {/* Indicador de guardado */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-background border rounded-lg p-3 shadow-lg flex items-center gap-2 z-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Guardando...</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5">
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex gap-3">
              <EditableField
                value={formValues.code || ""}
                onSave={(value) => handleFieldChange("code", value)}
                className="font-bold text-white/50 text-2xl"
                placeholder="Código"
              />
              <EditableSelect
                value={formValues.tracing}
                options={tracingOptions}
                onSave={(value) => handleFieldChange("tracing", value)}
                renderDisplay={() => (
                  <TracingBadge tracing={formValues.tracing} />
                )}
                getLabel={(key) => tracingOptions[key]?.label || key}
              />
            </div>

            <EditableField
              value={formValues.order}
              onSave={(value) => handleFieldChange("order", value)}
              className="font-bold text-2xl"
              style={{
                fontWeight: "bolder",
                fontSize: "2.5rem",
              }}
              placeholder="Orden"
            />

            <EditableField
              value={formValues.name}
              onSave={(value) => handleFieldChange("name", value)}
              className="text-white/50"
              style={{
                fontSize: "1.3rem",
              }}
              placeholder="Nombre del expediente"
              isDescription
            />

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
            <CardFooter>
              <EditableField
                value={formValues.insurance || ""}
                onSave={(value) => handleFieldChange("insurance", value)}
                placeholder="Cobertura"
              />
            </CardFooter>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50 mb-0.5">Defensor</p>
            <EditableList
              items={formValues.defendant}
              onSave={(items) => handleFieldChange("defendant", items)}
              className="border rounded-2xl p-1.5 text-sm text-white/50 space-y-1.5"
            />

            <p className="text-sm text-white/50 mt-1.5">Actor</p>
            <EditableList
              items={formValues.prosecutor}
              onSave={(items) => handleFieldChange("prosecutor", items)}
              className="border rounded-2xl p-1.5 text-sm text-white/50 space-y-1.5"
            />
          </CardContent>
        </Card>

        <div className="space-y-1.5 mt-3">
          <h3 className="text-2xl font-thin tracking-wide uppercase">Notas</h3>
          {RecordNote.map((note: any, index: number) => (
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
    </div>
  );
}
