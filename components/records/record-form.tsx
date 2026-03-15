"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TRACING_OPTIONS } from "@/app/constants";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardHeader,
} from "../ui/card";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, FileText, ArrowLeft } from "lucide-react";
import { TracingBadge } from "./tracing-badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { District, Court, Office } from "@/app/generated/prisma/client";

/* ---------- Zod schema ---------- */
export const recordSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres"),
  order: z.string().min(1, "Campo requerido"),
  tracing: z.enum(Object.keys(TRACING_OPTIONS) as [string, ...string[]]),
  defendant: z.array(z.object({ value: z.string() })).default([]),
  prosecutor: z.array(z.object({ value: z.string() })).default([]),
  insurance: z.array(z.object({ value: z.string() })).default([]),
  officeId: z.union([z.number(), z.null()]).optional(),
  code: z.string().optional(),
});

export type RecordFormValues = z.infer<typeof recordSchema>;

export type FormValues = RecordFormValues & {
  districtId?: number;
  courtId?: number;
};

interface RecordFormProps {
  districts: (District & {
    Court: (Court & { Office: Office[] })[];
  })[];
}

const resolver = zodResolver(recordSchema) as Resolver<FormValues>;

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <p className="text-xs font-medium text-muted-foreground mb-1 select-none">
      {children}
      {required && (
        <span className="text-destructive ml-0.5" aria-hidden>
          *
        </span>
      )}
    </p>
  );
}

function PartySection({
  label,
  fields,
  onAdd,
  onRemove,
  register,
  fieldPrefix,
}: {
  label: string;
  fields: { id: string }[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  register: (name: string) => object;
  fieldPrefix: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="border rounded-lg bg-muted/20 overflow-hidden">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-1.5 px-2 py-1 border-b last:border-b-0"
          >
            <Input
              {...(register(`${fieldPrefix}.${index}.value`) as object)}
              placeholder="Nombre completo"
              className="h-7 text-xs border-none bg-transparent focus-visible:ring-0 px-0 placeholder:text-muted-foreground/40"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="h-5 w-5 shrink-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="w-full flex items-center gap-1 px-2 py-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent/40 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Agregar {label.toLowerCase()}
        </button>
      </div>
    </div>
  );
}

export function RecordForm({ districts }: RecordFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      name: "",
      order: "",
      tracing: Object.keys(TRACING_OPTIONS)[0],
      defendant: [],
      prosecutor: [],
      insurance: [],
      officeId: null,
      districtId: undefined,
      courtId: undefined,
      code: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        defendant: data.defendant.map((d) => d.value).filter(Boolean),
        prosecutor: data.prosecutor.map((p) => p.value).filter(Boolean),
        insurance: data.insurance.map((i) => i.value).filter(Boolean),
      };

      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear expediente");
      }

      const newRecord = await res.json();
      window.dispatchEvent(new CustomEvent("new-record", { detail: newRecord }));
      toast.success("Expediente creado correctamente");
      router.push(`/records/${newRecord.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear expediente"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const defendantArray = useFieldArray({ control, name: "defendant" });
  const prosecutorArray = useFieldArray({ control, name: "prosecutor" });
  const insuranceArray = useFieldArray({ control, name: "insurance" });

  const districtId = watch("districtId");
  const courtId = watch("courtId");
  const tracing = watch("tracing");

  const selectedDistrict = districts.find((d) => d.id === districtId);
  const availableCourts = selectedDistrict?.Court ?? [];
  const selectedCourt = availableCourts.find((c) => c.id === courtId);
  const availableOffices = selectedCourt?.Office ?? [];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex-1 flex flex-col min-h-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-7 w-7 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold text-foreground">
            Nuevo expediente
          </h1>
        </div>
        <p className="text-[11px] text-muted-foreground/60">
          <span className="text-destructive">*</span> campos requeridos
        </p>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        {/* Card principal */}
        <Card className="col-span-2 flex flex-col">
          <CardHeader className="pb-0 shrink-0">
            {/* Código + Tracing */}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <FieldLabel>Código</FieldLabel>
                <Input
                  {...register("code")}
                  placeholder="ej: A-123"
                  className="h-8 text-sm font-mono border-muted bg-muted/30 focus-visible:bg-background"
                />
              </div>
              <div>
                <FieldLabel>Estado</FieldLabel>
                <Controller
                  control={control}
                  name="tracing"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-auto border-none bg-transparent p-0 h-auto focus:ring-0 [&>svg]:hidden shadow-none">
                        <TracingBadge tracing={tracing} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TRACING_OPTIONS).map(([key, option]) => (
                          <SelectItem key={key} value={key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Número de expediente */}
            <div className="mt-3">
              <FieldLabel required>Número de expediente</FieldLabel>
              <Input
                {...register("order")}
                placeholder="ej: 12345/2024"
                className={cn(
                  "text-xl font-bold border-muted bg-muted/30 focus-visible:bg-background h-10",
                  errors.order && "border-destructive/50 focus-visible:ring-destructive/30"
                )}
              />
              {errors.order && (
                <p className="text-destructive text-[11px] mt-1">
                  {errors.order.message}
                </p>
              )}
            </div>

            {/* Carátula */}
            <div className="mt-3">
              <FieldLabel required>Carátula</FieldLabel>
              <Input
                {...register("name")}
                placeholder="ej: García, Juan c/ López, María s/ Daños y Perjuicios"
                className={cn(
                  "text-sm border-muted bg-muted/30 focus-visible:bg-background",
                  errors.name && "border-destructive/50 focus-visible:ring-destructive/30"
                )}
              />
              {errors.name && (
                <p className="text-destructive text-[11px] mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1" />
        </Card>

        {/* Card de detalles */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-4">
            {/* Ubicación */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                Ubicación
              </p>
              <div className="space-y-2">
                <div>
                  <FieldLabel>Circunscripción</FieldLabel>
                  <Controller
                    control={control}
                    name="districtId"
                    render={({ field }) => (
                      <Select
                        onValueChange={(v) => {
                          field.onChange(Number(v));
                          setValue("courtId", undefined);
                          setValue("officeId", null);
                        }}
                        value={field.value ? String(field.value) : ""}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <FieldLabel>Juzgado</FieldLabel>
                  <Controller
                    control={control}
                    name="courtId"
                    render={({ field }) => (
                      <Select
                        disabled={!selectedDistrict}
                        onValueChange={(v) => {
                          field.onChange(Number(v));
                          setValue("officeId", null);
                        }}
                        value={field.value ? String(field.value) : ""}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue
                            placeholder={selectedDistrict ? "Seleccionar..." : "—"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCourts.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <FieldLabel>Secretaría</FieldLabel>
                  <Controller
                    control={control}
                    name="officeId"
                    render={({ field }) => (
                      <Select
                        disabled={!selectedCourt}
                        onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                        value={field.value ? String(field.value) : ""}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue
                            placeholder={selectedCourt ? "Seleccionar..." : "—"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOffices.map((o) => (
                            <SelectItem key={o.id} value={String(o.id)}>
                              {o.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Partes */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
                Partes
              </p>
              <div className="space-y-3">
                <PartySection
                  label="Defensor"
                  fields={defendantArray.fields}
                  onAdd={() => defendantArray.append({ value: "" })}
                  onRemove={(i) => defendantArray.remove(i)}
                  register={register}
                  fieldPrefix="defendant"
                />
                <PartySection
                  label="Actor"
                  fields={prosecutorArray.fields}
                  onAdd={() => prosecutorArray.append({ value: "" })}
                  onRemove={(i) => prosecutorArray.remove(i)}
                  register={register}
                  fieldPrefix="prosecutor"
                />
                <PartySection
                  label="Aseguradora"
                  fields={insuranceArray.fields}
                  onAdd={() => insuranceArray.append({ value: "" })}
                  onRemove={(i) => insuranceArray.remove(i)}
                  register={register}
                  fieldPrefix="insurance"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Acciones */}
      <div className="mt-3 shrink-0 flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Crear expediente
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
