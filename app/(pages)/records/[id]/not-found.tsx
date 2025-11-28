"use client";

import Link from "next/link";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecordNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-5">
            <FileX className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Expediente no encontrado
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            El expediente que buscas no existe o fue eliminado.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/">Ver todos los expedientes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/records/create">Crear nuevo</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

