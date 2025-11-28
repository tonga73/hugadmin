"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface District {
  id: number;
  name: string;
}

interface Court {
  id: number;
  name: string;
  districtId: number | null;
  District: District | null;
}

interface Office {
  id: number;
  name: string;
  courtId: number | null;
  Court: Court | null;
}

interface OfficeSelectorProps {
  currentOffice?: {
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
  onSave: (officeId: number | null) => Promise<void>;
  className?: string;
}

export function OfficeSelector({
  currentOffice,
  onSave,
  className,
}: OfficeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);

  // Estados de selección
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    currentOffice?.Court?.District?.id?.toString() || ""
  );
  const [selectedCourtId, setSelectedCourtId] = useState<string>(
    currentOffice?.Court?.id?.toString() || ""
  );
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(
    currentOffice?.id?.toString() || ""
  );

  // Cargar offices cuando se abre el popover
  useEffect(() => {
    if (isOpen && offices.length === 0) {
      loadOffices();
    }
  }, [isOpen]);

  const loadOffices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/offices");
      if (response.ok) {
        const data = await response.json();
        setOffices(data);
      }
    } catch (error) {
      console.error("Error loading offices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extraer districts únicos
  const districts = useMemo(() => {
    const uniqueDistricts = new Map<number, District>();
    offices.forEach((office) => {
      if (office.Court?.District) {
        uniqueDistricts.set(office.Court.District.id, office.Court.District);
      }
    });
    return Array.from(uniqueDistricts.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [offices]);

  // Filtrar courts por district seleccionado
  const courts = useMemo(() => {
    if (!selectedDistrictId) return [];
    const uniqueCourts = new Map<number, Court>();
    offices.forEach((office) => {
      if (
        office.Court &&
        office.Court.districtId === parseInt(selectedDistrictId)
      ) {
        uniqueCourts.set(office.Court.id, office.Court);
      }
    });
    return Array.from(uniqueCourts.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [offices, selectedDistrictId]);

  // Filtrar offices por court seleccionado
  const filteredOffices = useMemo(() => {
    if (!selectedCourtId) return [];
    return offices
      .filter((office) => office.courtId === parseInt(selectedCourtId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [offices, selectedCourtId]);

  // Resetear selecciones dependientes
  const handleDistrictChange = (value: string) => {
    setSelectedDistrictId(value);
    setSelectedCourtId("");
    setSelectedOfficeId("");
  };

  const handleCourtChange = (value: string) => {
    setSelectedCourtId(value);
    setSelectedOfficeId("");
  };

  const handleOfficeChange = (value: string) => {
    setSelectedOfficeId(value);
  };

  const handleSave = async () => {
    if (!selectedOfficeId) return;

    setIsSaving(true);
    try {
      await onSave(parseInt(selectedOfficeId));
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving office:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      await onSave(null);
      setSelectedDistrictId("");
      setSelectedCourtId("");
      setSelectedOfficeId("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error clearing office:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Display actual
  const displayText = currentOffice
    ? currentOffice.Court?.name || "Sin juzgado"
    : "Sin asignar";

  const displaySubtext = currentOffice
    ? `Secretaría ${currentOffice.name} | ${currentOffice.Court?.District?.name || ""} Circunscripción`
    : "Click para asignar";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full text-left hover:bg-accent/50 rounded-lg p-2 -m-2 transition-colors group",
            className
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{displayText}</p>
              <p className="text-sm text-muted-foreground truncate">
                {displaySubtext}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Asignar ubicación</h4>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Circunscripción */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Circunscripción
                </label>
                <Select
                  value={selectedDistrictId}
                  onValueChange={handleDistrictChange}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) => (
                      <SelectItem
                        key={district.id}
                        value={district.id.toString()}
                      >
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Juzgado */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Juzgado</label>
                <Select
                  value={selectedCourtId}
                  onValueChange={handleCourtChange}
                  disabled={!selectedDistrictId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={
                        selectedDistrictId
                          ? "Seleccionar..."
                          : "Primero selecciona circunscripción"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.map((court) => (
                      <SelectItem key={court.id} value={court.id.toString()}>
                        {court.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Secretaría */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Secretaría
                </label>
                <Select
                  value={selectedOfficeId}
                  onValueChange={handleOfficeChange}
                  disabled={!selectedCourtId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={
                        selectedCourtId
                          ? "Seleccionar..."
                          : "Primero selecciona juzgado"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredOffices.map((office) => (
                      <SelectItem key={office.id} value={office.id.toString()}>
                        {office.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                {currentOffice && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    Quitar
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!selectedOfficeId || isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

