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
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2, FileText } from "lucide-react";
import { TracingBadge } from "./tracing-badge";
import { toast } from "sonner";
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

/* Agregamos campos auxiliares para la selección jerárquica */
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

  /* Arrays de partes */
  const defendantArray = useFieldArray({ control, name: "defendant" });
  const prosecutorArray = useFieldArray({ control, name: "prosecutor" });
  const insuranceArray = useFieldArray({ control, name: "insurance" });

  /* Valores seleccionados */
  const districtId = watch("districtId");
  const courtId = watch("courtId");
  const tracing = watch("tracing");

  const selectedDistrict = districts.find((d) => d.id === districtId);
  const availableCourts = selectedDistrict?.Court ?? [];
  const selectedCourt = availableCourts.find((c) => c.id === courtId);
  const availableOffices = selectedCourt?.Office ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 grid grid-cols-3 gap-1.5 min-h-0">
        {/* Card principal - similar a la vista de edición */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <Input
                  {...register("code")}
                  placeholder="Código (ej: A-123)"
                  className="font-bold text-muted-foreground text-lg border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
              </div>
              <Controller
                control={control}
                name="tracing"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-auto border-none bg-transparent p-0 h-auto focus:ring-0 [&>svg]:hidden">
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

            <div>
              <Input
                {...register("order")}
                placeholder="Número de expediente (ej: 12345/2024)"
                className="font-bold text-3xl border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
              />
              {errors.order && (
                <p className="text-destructive text-xs mt-1">
                  {errors.order.message}
                </p>
              )}
            </div>

            <div>
              <Input
                {...register("name")}
                placeholder="Carátula del expediente (ej: García, Juan c/ López, María s/ Daños y Perjuicios)"
                className="text-muted-foreground text-lg border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent />
        </Card>

        {/* Card de detalles - ubicación y partes */}
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="py-2 shrink-0">
            <CardTitle className="text-sm font-medium">Ubicación</CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-y-auto min-h-0 px-3 pb-2 space-y-2">
            {/* Ubicación */}
            <div className="space-y-1.5">
              <Controller
                control={control}
                name="districtId"
                render={({ field }) => (
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">
                      Circunscripción
                    </label>
                    <Select
                      onValueChange={(v) => {
                        const val = Number(v);
                        field.onChange(val);
                        setValue("courtId", undefined);
                        setValue("officeId", null);
                      }}
                      value={field.value ? String(field.value) : ""}
                    >
                      <SelectTrigger className="h-7 text-xs">
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
                  </div>
                )}
              />

              <Controller
                control={control}
                name="courtId"
                render={({ field }) => (
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">
                      Juzgado
                    </label>
                    <Select
                      disabled={!selectedDistrict}
                      onValueChange={(v) => {
                        const val = Number(v);
                        field.onChange(val);
                        setValue("officeId", null);
                      }}
                      value={field.value ? String(field.value) : ""}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={selectedDistrict ? "Seleccionar..." : "—"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourts.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="officeId"
                render={({ field }) => (
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">
                      Secretaría
                    </label>
                    <Select
                      disabled={!selectedCourt}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                      value={field.value ? String(field.value) : ""}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder={selectedCourt ? "Seleccionar..." : "—"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOffices.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            </div>

            {/* Partes */}
            <div className="space-y-1.5">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Defensor</p>
                <div className="border rounded-lg p-1 space-y-0.5">
                  {defendantArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-1">
                      <Input
                        {...register(`defendant.${index}.value`)}
                        placeholder="Nombre"
                        className="h-6 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => defendantArray.remove(index)}
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => defendantArray.append({ value: "" })}
                    className="w-full h-5 text-[10px] text-muted-foreground"
                  >
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Actor</p>
                <div className="border rounded-lg p-1 space-y-0.5">
                  {prosecutorArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-1">
                      <Input
                        {...register(`prosecutor.${index}.value`)}
                        placeholder="Nombre"
                        className="h-6 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => prosecutorArray.remove(index)}
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => prosecutorArray.append({ value: "" })}
                    className="w-full h-5 text-[10px] text-muted-foreground"
                  >
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Aseguradora</p>
                <div className="border rounded-lg p-1 space-y-0.5">
                  {insuranceArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-1">
                      <Input
                        {...register(`insurance.${index}.value`)}
                        placeholder="Nombre"
                        className="h-6 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => insuranceArray.remove(index)}
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insuranceArray.append({ value: "" })}
                    className="w-full h-5 text-[10px] text-muted-foreground"
                  >
                    <Plus className="h-2.5 w-2.5 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Botón de guardar */}
      <div className="mt-2 shrink-0">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
        >
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
