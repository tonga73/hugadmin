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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TracingBadge } from "@/components/records";
import { EditableField } from "./editable-field";
import { EditableSelect } from "./editable-select";
import { EditableList } from "./editable-list";
import { NotesSection } from "./notes-section";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DeleteButton } from "@/components/records/delete-button";

// Schema de validación
const recordSchema = z.object({
  code: z.string().optional(),
  order: z.string().min(1, "Requerido"),
  name: z.string().min(3, "Mínimo 3 caracteres"),
  insurance: z.string().optional(), // Array
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
  const [isOpen, setIsOpen] = useState(false);
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
      insurance: record.insurance || [],
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

      const updatedRecord = await response.json();

      // 🔹 Disparar evento para actualizar la lista
      window.dispatchEvent(
        new CustomEvent("update-record", { detail: updatedRecord })
      );

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
    <div className="relative flex-1 flex flex-col">
      {/* Indicador de guardado */}
      {isSaving && (
        <div className="fixed top-4 right-4 bg-background border rounded-lg p-3 shadow-lg flex items-center gap-2 z-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Guardando...</span>
        </div>
      )}

      <div className="flex-1 grid grid-cols-3 gap-1.5">
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex gap-3">
              <EditableField
                value={formValues.code || ""}
                onSave={(value) => handleFieldChange("code", value)}
                className="font-bold text-muted-foreground text-2xl"
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
              className="text-muted-foreground"
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
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-0.5">Defensor</p>
            <EditableList
              items={formValues.defendant}
              onSave={(items) => handleFieldChange("defendant", items)}
              className="border rounded-2xl p-1.5 text-sm text-muted-foreground space-y-1.5"
            />

            <p className="text-sm text-muted-foreground mt-1.5">Actor</p>
            <EditableList
              items={formValues.prosecutor}
              onSave={(items) => handleFieldChange("prosecutor", items)}
              className="border rounded-2xl p-1.5 text-sm text-muted-foreground space-y-1.5"
            />
          </CardContent>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-0.5">Aseguradora</p>

            <EditableField
              value={
                formValues.insurance?.length && formValues.insurance?.length > 0
                  ? formValues.insurance
                  : "---"
              }
              onSave={(value) => handleFieldChange("insurance", value)}
              placeholder="Seguro"
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-2">
        <NotesSection
          recordId={record.id}
          initialNotes={RecordNote.map((note: any) => ({
            id: note.id,
            name: note.name,
            text: note.text,
            recordId: record.id,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          }))}
        />
      </div>

      <Collapsible onOpenChange={() => setIsOpen(!isOpen)}>
        <CollapsibleTrigger
          className={isOpen ? "w-full text-sm font-medium" : "w-full text-sm"}
        >
          {isOpen ? "Ocultar opciones" : "Más opciones"}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <DeleteButton recordId={record.id} recordName={record.name} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
