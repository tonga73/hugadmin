"use client";

import { useForm, Controller, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PRIORITY_OPTIONS, TRACING_OPTIONS } from "@/app/constants";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { useRouter } from "next/navigation";
import type { District, Court, Office } from "@/app/generated/prisma/client";

/* ---------- Zod schema ---------- */
export const recordSchema = z.object({
  name: z.string().min(3, "Debe tener al menos 3 caracteres"),
  order: z.string().min(1, "Campo requerido"),
  tracing: z.enum(Object.keys(TRACING_OPTIONS) as [string, ...string[]]),
  priority: z.enum(Object.keys(PRIORITY_OPTIONS) as [string, ...string[]]),
  archive: z.boolean().default(false),
  favorite: z.boolean().default(false),
  defendant: z.array(z.string()).default([]),
  prosecutor: z.array(z.string()).default([]),
  insurance: z.array(z.string()).default([]),
  officeId: z.union([z.number(), z.null()]).optional(),
  code: z.string().optional(),
  code__VALUES: z.string().optional(),
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
      priority: Object.keys(PRIORITY_OPTIONS)[0],
      archive: false,
      favorite: false,
      defendant: [""],
      prosecutor: [],
      insurance: [],
      officeId: null,
      districtId: undefined,
      courtId: undefined,
      code: "",
      code__VALUES: "",
    },
  });

  const onSubmit = async (data: RecordFormValues) => {
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const newRecord = await res.json();

    window.dispatchEvent(new CustomEvent("new-record", { detail: newRecord }));
    router.push(`/records/${newRecord.id}`);
  };

  /* Arrays de partes */
  const defendantArray = useFieldArray<FormValues>({
    control,
    name: "defendant",
  });
  const prosecutorArray = useFieldArray<FormValues>({
    control,
    name: "prosecutor",
  });
  const insuranceArray = useFieldArray<FormValues>({
    control,
    name: "insurance",
  });

  /* Valores seleccionados */
  const districtId = watch("districtId");
  const courtId = watch("courtId");

  const selectedDistrict = districts.find((d) => d.id === districtId);
  const availableCourts = selectedDistrict?.Court ?? [];
  const selectedCourt = availableCourts.find((c) => c.id === courtId);
  const availableOffices = selectedCourt?.Office ?? [];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 p-4 max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-slate-100 mb-4">
        Formulario de Expediente
      </h1>

      {/* Nombre y número */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre del expediente
          </label>
          <Input placeholder="Ej: Caso Smith vs. Jones" {...register("name")} />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Número de orden
          </label>
          <Input placeholder="Ej: 2023-00123" {...register("order")} />
          {errors.order && (
            <p className="text-red-500 text-sm mt-1">{errors.order.message}</p>
          )}
        </div>
      </div>

      {/* Estado y prioridad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={control}
          name="tracing"
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <Select
                onValueChange={field.onChange}
                value={field.value as string}
              >
                <SelectTrigger>
                  {TRACING_OPTIONS[field.value as keyof typeof TRACING_OPTIONS]
                    ?.label ?? "Seleccionar estado"}
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRACING_OPTIONS).map(([key, option]) => (
                    <SelectItem key={key} value={key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />

        <Controller
          control={control}
          name="priority"
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">
                Prioridad
              </label>
              <Select
                onValueChange={field.onChange}
                value={field.value as string}
              >
                <SelectTrigger>
                  {PRIORITY_OPTIONS[
                    field.value as keyof typeof PRIORITY_OPTIONS
                  ]?.label ?? "Seleccionar prioridad"}
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_OPTIONS).map(([key, option]) => (
                    <SelectItem key={key} value={key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      {/* Jerarquía de selección */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* District */}
        <Controller
          control={control}
          name="districtId"
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Distrito</label>
              <Select
                onValueChange={(v) => {
                  const val = Number(v);
                  field.onChange(val);
                  setValue("courtId", undefined);
                  setValue("officeId", null);
                }}
                value={field.value ? String(field.value) : ""}
              >
                <SelectTrigger>
                  {selectedDistrict?.name ?? "Seleccionar distrito"}
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

        {/* Court */}
        <Controller
          control={control}
          name="courtId"
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Juzgado</label>
              <Select
                disabled={!selectedDistrict}
                onValueChange={(v) => {
                  const val = Number(v);
                  field.onChange(val);
                  setValue("officeId", null);
                }}
                value={field.value ? String(field.value) : ""}
              >
                <SelectTrigger>
                  {selectedCourt?.name ?? "Seleccionar juzgado"}
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

        {/* Office */}
        <Controller
          control={control}
          name="officeId"
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium mb-1">Oficina</label>
              <Select
                disabled={!selectedCourt}
                onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                value={field.value ? String(field.value) : ""}
              >
                <SelectTrigger>
                  {availableOffices.find((o) => o.id === field.value)?.name ??
                    "Seleccionar oficina"}
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

      {/* Checkboxes */}
      <div className="flex items-center gap-6">
        <Controller
          control={control}
          name="archive"
          render={({ field }) => (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
              />
              <span>Archivado</span>
            </label>
          )}
        />
        <Controller
          control={control}
          name="favorite"
          render={({ field }) => (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={field.value as boolean}
                onCheckedChange={field.onChange}
              />
              <span>Favorito</span>
            </label>
          )}
        />
      </div>

      {/* Códigos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Código</label>
          <Input placeholder="Código" {...register("code")} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Código "VALUES"
          </label>
          <Input placeholder='Código "VALUES"' {...register("code__VALUES")} />
        </div>
      </div>

      {/* Demandados, fiscales y aseguradoras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-slate-700 pt-6">
        {[
          { label: "Demandados", arr: defendantArray, key: "defendant" },
          { label: "Fiscales", arr: prosecutorArray, key: "prosecutor" },
          { label: "Aseguradoras", arr: insuranceArray, key: "insurance" },
        ].map(({ label, arr, key }) => (
          <div key={key} className="space-y-2">
            <h4 className="font-medium">{label}</h4>
            {arr.fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  {...register(
                    `${key}.${index}` as
                      | `defendant.${number}`
                      | `prosecutor.${number}`
                      | `insurance.${number}`
                  )}
                  placeholder={`${label.slice(0, -1)} #${index + 1}`}
                />

                <Button
                  type="button"
                  onClick={() => arr.remove(index)}
                  className="bg-red-800 hover:bg-red-700 text-white px-3"
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() => arr.append("")}
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm"
            >
              + Añadir {label.slice(0, -1)}
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
      >
        Guardar expediente
      </Button>
    </form>
  );
}
