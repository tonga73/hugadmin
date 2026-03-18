"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, Star } from "lucide-react";
import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TracingBadge } from "@/components/records";
import { PRIORITY_OPTIONS } from "@/app/constants";
import { EditableField } from "./editable-field";
import { EditableSelect } from "./editable-select";
import { EditableList } from "./editable-list";
import { NotesSection } from "./notes-section";
import { OfficeSelector } from "./office-selector";
import { toast } from "sonner";
import { DeleteButton } from "@/components/records/delete-button";
import { FilesSection } from "@/components/records/files-section";
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
  priority: z.string(),
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
    priority: string;
    favorite: boolean;
    officeId?: number | null;
    Note: Array<{
      id: number;
      name: string | null;
      text: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    files: Array<{
      id: number;
      recordId: number | null;
      name: string;
      url: string;
      storagePath: string;
      type: string;
      size: number;
      aiMatch: boolean;
      aiConfidence: number | null;
      createdAt: Date;
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
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isFavorite, setIsFavorite] = useState(record.favorite);
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
      priority: record.priority,
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
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden">

      {/* Top action bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="h-7 w-7 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-muted-foreground">
            Expediente
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFavorite}
            disabled={isTogglingFavorite}
            className={cn(
              "h-8 w-8 transition-all",
              isFavorite
                ? "text-amber-400 hover:text-amber-500"
                : "text-muted-foreground/50 hover:text-amber-400"
            )}
            title={isFavorite ? "Quitar de destacados" : "Marcar como destacado"}
          >
            {isTogglingFavorite ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star className={cn("h-4 w-4", isFavorite && "fill-amber-400")} />
            )}
          </Button>
        </div>
      </div>

      {/* Contenido principal con altura flexible */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Grid de cards - altura fija */}
        <div className="grid grid-cols-3 gap-1.5 shrink-0">
          {/* Card principal */}
          <Card className="col-span-2">
            <CardHeader className="pb-2">
              <div className="flex gap-3">
                <EditableField
                  value={formValues.code || ""}
                  onSave={(value) => handleFieldChange("code", value)}
                  className="font-bold text-muted-foreground text-xl"
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
                <EditableSelect
                  value={formValues.priority}
                  options={PRIORITY_OPTIONS}
                  onSave={(value) => handleFieldChange("priority", value)}
                  renderDisplay={() => {
                    const p = PRIORITY_OPTIONS[formValues.priority];
                    return p ? (
                      <Badge style={{ backgroundColor: p.color, color: "#1a1a1a" }}>
                        {p.label}
                      </Badge>
                    ) : null;
                  }}
                  getLabel={(key) => PRIORITY_OPTIONS[key]?.label || key}
                />
              </div>

              <EditableField
                value={formValues.order}
                onSave={(value) => handleFieldChange("order", value)}
                className="font-bold text-2xl"
                style={{ fontWeight: "bolder", fontSize: "2rem" }}
                placeholder="Orden"
              />

              <EditableField
                value={formValues.name}
                onSave={(value) => handleFieldChange("name", value)}
                className="text-muted-foreground text-base"
                placeholder="Nombre del expediente"
                isDescription
              />

            </CardHeader>
          </Card>

          {/* Card de detalles */}
          <Card className="flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="pb-1 shrink-0">
              <OfficeSelector
                currentOffice={currentOffice}
                onSave={handleOfficeSave}
              />
            </CardHeader>
            <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-3 space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
                  Partes
                </p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Defensor</p>
                    <EditableList
                      items={formValues.defendant}
                      onSave={(items) => handleFieldChange("defendant", items)}
                      className="border rounded-xl p-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Actor</p>
                    <EditableList
                      items={formValues.prosecutor}
                      onSave={(items) => handleFieldChange("prosecutor", items)}
                      className="border rounded-xl p-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Aseguradora</p>
                    <EditableList
                      items={formValues.insurance || []}
                      onSave={(items) => handleFieldChange("insurance", items)}
                      className="border rounded-xl p-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="shrink-0 px-3 pb-3 pt-2 border-t">
              <DeleteButton recordId={record.id} recordName={record.name} />
            </div>
          </Card>
        </div>

        {/* Sección de notas - altura flexible */}
        <div className="shrink-0">
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

        {/* Sección de archivos adjuntos */}
        <div className="shrink-0">
          <FilesSection
            recordId={record.id}
            initialFiles={record.files.map((f) => ({
              ...f,
              createdAt: f.createdAt.toISOString(),
            }))}
          />
        </div>

      </div>
    </div>
  );
}
