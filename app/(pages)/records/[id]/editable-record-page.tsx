"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { FaExclamation } from "react-icons/fa";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TracingBadge } from "@/components/records";
import { EditableField } from "./editable-field";
import { EditableSelect } from "./editable-select";
import { EditableList } from "./editable-list";
import { NotesSection } from "./notes-section";
import { OfficeSelector } from "./office-selector";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DeleteButton } from "@/components/records/delete-button";
import { cn } from "@/lib/utils";

// Schema de validación para campos editables
const recordSchema = z.object({
  code: z.string().optional(),
  order: z.string().min(1, "Requerido"),
  name: z.string().min(3, "Mínimo 3 caracteres"),
  insurance: z.array(z.string()),
  defendant: z.array(z.string()),
  prosecutor: z.array(z.string()),
  tracing: z.string(),
});

type RecordFormValues = z.infer<typeof recordSchema>;

interface EditableRecordPageProps {
  record: {
    id: number;
    code?: string | null;
    order: string;
    name: string;
    insurance?: string[];
    defendant?: string[];
    prosecutor?: string[];
    tracing: string;
    favorite: boolean;
    officeId?: number | null;
    Note: Array<{
      id: number;
      name: string | null;
      text: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    Office?: {
      id: number;
      name: string;
      Court?: {
        id: number;
        name: string;
        District?: {
          id: number;
          name: string;
        } | null;
      } | null;
    } | null;
  };
  tracingOptions: Record<string, { label: string; color?: string }>;
}

export default function EditableRecordPage({
  record,
  tracingOptions,
}: EditableRecordPageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isFavorite, setIsFavorite] = useState(record.favorite);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [currentOffice, setCurrentOffice] = useState(record.Office);

  const { Note: RecordNote } = record;

  const { setValue, watch } = useForm<RecordFormValues>({
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

  // Función genérica para guardar cualquier campo
  const saveField = useCallback(
    async (fieldName: string, value: unknown) => {
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

        // Disparar evento para actualizar la lista
        window.dispatchEvent(
          new CustomEvent("update-record", { detail: updatedRecord })
        );

        toast.success("Cambios guardados");
        return updatedRecord;
      } catch (error) {
        console.error("Error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudo guardar los cambios"
        );
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [record.id]
  );

  // Handler para campos del formulario
  const handleFieldChange = useCallback(
    (fieldName: keyof RecordFormValues, value: unknown) => {
      setValue(fieldName, value as any);
      saveField(fieldName, value).catch(() => {
        // Revertir en caso de error
        setValue(fieldName, record[fieldName] as any);
      });
    },
    [setValue, saveField, record]
  );

  // Toggle de favorito
  const toggleFavorite = useCallback(async () => {
    const newValue = !isFavorite;
    setIsTogglingFavorite(true);
    setIsFavorite(newValue); // Optimistic update

    try {
      await saveField("favorite", newValue);
    } catch {
      setIsFavorite(!newValue); // Revertir en caso de error
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [isFavorite, saveField]);

  // Guardar office
  const handleOfficeSave = useCallback(
    async (officeId: number | null) => {
      const response = await fetch(`/api/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      const updatedRecord = await response.json();

      // Actualizar estado local
      setCurrentOffice(updatedRecord.Office);

      // Disparar evento para actualizar la lista
      window.dispatchEvent(
        new CustomEvent("update-record", { detail: updatedRecord })
      );

      toast.success("Ubicación actualizada");
    },
    [record.id]
  );

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
        {/* Card principal */}
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
              style={{ fontWeight: "bolder", fontSize: "2.5rem" }}
              placeholder="Orden"
            />

            <EditableField
              value={formValues.name}
              onSave={(value) => handleFieldChange("name", value)}
              className="text-muted-foreground"
              style={{ fontSize: "1.3rem" }}
              placeholder="Nombre del expediente"
              isDescription
            />

            {/* Botón de favorito */}
            <CardAction>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFavorite}
                disabled={isTogglingFavorite}
                className={cn(
                  "h-8 w-8 transition-all",
                  isFavorite
                    ? "text-emerald-400 hover:text-emerald-500 bg-emerald-400/10"
                    : "text-muted-foreground hover:text-emerald-400"
                )}
                title={isFavorite ? "Quitar de destacados" : "Marcar como destacado"}
              >
                {isTogglingFavorite ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FaExclamation className="h-4 w-4" />
                )}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent />
        </Card>

        {/* Card de detalles */}
        <Card>
          <CardHeader>
            <OfficeSelector
              currentOffice={currentOffice}
              onSave={handleOfficeSave}
            />
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
            <EditableList
              items={formValues.insurance || []}
              onSave={(items) => handleFieldChange("insurance", items)}
              className="border rounded-2xl p-1.5 text-sm text-muted-foreground space-y-1.5"
            />
          </CardContent>
        </Card>
      </div>

      {/* Sección de notas */}
      <div className="mt-2">
        <NotesSection
          recordId={record.id}
          initialNotes={RecordNote.map((note) => ({
            id: note.id,
            name: note.name,
            text: note.text,
            recordId: record.id,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          }))}
        />
      </div>

      {/* Opciones adicionales */}
      <Collapsible open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <CollapsibleTrigger className="w-full text-sm hover:underline">
          {isOptionsOpen ? "Ocultar opciones" : "Más opciones"}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <DeleteButton recordId={record.id} recordName={record.name} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
