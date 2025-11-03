import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITY_OPTIONS, TRACING_OPTIONS } from "@/app/constants";

const recordSchema = z.object({
  name: z.string().min(3, "Debe tener al menos 3 caracteres"),
  order: z.string().min(1),
  tracing: z.enum(Object.keys(TRACING_OPTIONS) as [string, ...string[]]),
  priority: z.enum(Object.keys(PRIORITY_OPTIONS) as [string, ...string[]]),
});

export type RecordFormValues = z.infer<typeof recordSchema>;

interface RecordFormProps {
  defaultValues?: RecordFormValues;
  onSubmit: (data: RecordFormValues) => void;
}

export function RecordForm({ defaultValues, onSubmit }: RecordFormProps) {
  const { register, handleSubmit, control, formState } =
    useForm<RecordFormValues>({
      resolver: zodResolver(recordSchema),
      defaultValues,
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input placeholder="Nombre del expediente" {...register("name")} />
      {formState.errors.name && (
        <p className="text-red-500 text-sm">{formState.errors.name.message}</p>
      )}

      <Input placeholder="Número de orden" {...register("order")} />
      {formState.errors.order && (
        <p className="text-red-500 text-sm">{formState.errors.order.message}</p>
      )}

      {/* 🔹 Tracing */}
      <Controller
        control={control}
        name="tracing"
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRACING_OPTIONS).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* 🔹 Priority */}
      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar prioridad" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_OPTIONS).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      <Button type="submit">Guardar</Button>
    </form>
  );
}
