"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, Star } from "lucide-react";
import { RecordUsersPopover } from "@/components/records/record-users-popover";
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
import { RecordHistorySection } from "./record-history-section";
import { validateOrderYear } from "@/lib/record-number";
import { toast } from "sonner";
import { DeleteButton } from "@/components/records/delete-button";
import { FilesSection } from "@/components/records/files-section";
import { cn } from "@/lib/utils";
import { formatOrder } from "@/lib/record-number";
import { RecordAnalyzer } from "@/components/ai/record-analyzer";

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

interface Assignee {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
}

interface EditableRecordPageProps {
  assignees?: Assignee[];
  onBack?: () => void;
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
      category: "DRIVE" | "APARTADO" | "EXPEDIENTE";
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
  initialActivity?: Array<{
    id: number;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    user: { id: number; name: string | null; email: string; image: string | null } | null;
  }>;
  initialActivityNextCursor?: number | null;
}

export default function EditableRecordPage({
  record,
  tracingOptions,
  assignees: initialAssignees = [],
  onBack,
  initialActivity = [],
  initialActivityNextCursor = null,
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
      order: formatOrder(record.order),
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
      if (fieldName === "order") {
        const err = validateOrderYear(value as string);
        if (err) { toast.error(err); return; }
      }
      setValue(fieldName, value as any);
      saveField(fieldName, value).catch(() => {
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
    <div className="flex-1 flex flex-col min-h-0">

      {/* Top action bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onBack ? onBack() : router.push("/")}
            className="h-7 w-7 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-muted-foreground">
            Expediente
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isSaving && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
          )}

          <RecordAnalyzer recordId={record.id} recordOrder={formatOrder(record.order)} />

          {/* Asignados popover */}
          <RecordUsersPopover
            recordId={record.id}
            initialAssignees={initialAssignees}
          />

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

      {/* Main content — stacks on mobile, side-by-side on desktop */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2">

        {/* Left column: header + files */}
        <div className="flex-1 flex flex-col min-h-0 gap-2 min-w-0">

          {/* Header card */}
          <Card className="shrink-0">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <EditableField
                  value={formValues.code || ""}
                  onSave={(value) => handleFieldChange("code", value)}
                  className="font-bold text-muted-foreground text-base"
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
                className="font-bold"
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

          {/* Files — takes remaining height, scrollable */}
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              <FilesSection
                recordId={record.id}
                initialFiles={record.files.map((f) => ({
                  ...f,
                  createdAt: f.createdAt.toISOString(),
                }))}
              />
            </div>
          </Card>
        </div>

        {/* Right column — scrollable sidebar */}
        <div className="w-full lg:w-[260px] shrink-0 overflow-y-auto flex flex-col gap-2 pb-2">

          {/* Bloque expediente: juzgado + partes */}
          <Card className="shrink-0 px-3 py-2.5 space-y-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1.5">
                Juzgado
              </p>
              <OfficeSelector
                currentOffice={currentOffice}
                onSave={handleOfficeSave}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                Partes
              </p>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Defensor</p>
                <EditableList
                  items={formValues.defendant}
                  onSave={(items) => handleFieldChange("defendant", items)}
                  className="border rounded-xl p-1.5 text-sm"
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Actor</p>
                <EditableList
                  items={formValues.prosecutor}
                  onSave={(items) => handleFieldChange("prosecutor", items)}
                  className="border rounded-xl p-1.5 text-sm"
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Aseguradora</p>
                <EditableList
                  items={formValues.insurance || []}
                  onSave={(items) => handleFieldChange("insurance", items)}
                  className="border rounded-xl p-1.5 text-sm"
                />
              </div>
            </div>
          </Card>

          {/* Historial */}
          {initialActivity.length > 0 && (
            <Card className="shrink-0 px-3 py-2.5">
              <RecordHistorySection
                recordId={record.id}
                initialActivity={initialActivity}
                initialNextCursor={initialActivityNextCursor}
              />
            </Card>
          )}

          {/* Bloque notas */}
          <Card className="min-h-[240px] flex flex-col overflow-hidden p-0">
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
          </Card>

          {/* Delete */}
          <div className="shrink-0">
            <DeleteButton recordId={record.id} recordName={record.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
