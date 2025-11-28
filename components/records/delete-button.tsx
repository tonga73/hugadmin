"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface DeleteButtonProps {
  recordId: string | number;
  recordName: string;
}

export function DeleteButton({ recordId, recordName }: DeleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Notificar a la lista para que se actualice
        window.dispatchEvent(
          new CustomEvent("delete-record", { detail: { id: recordId } })
        );
        toast.success(`El expediente "${recordName}" ha sido eliminado.`);
        setShowConfirm(false);
        router.push("/");
      } else {
        toast.error(
          "Hubo un error al eliminar el expediente. Por favor, inténtalo de nuevo."
        );
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error(
        "Hubo un error al eliminar el expediente. Por favor, inténtalo de nuevo."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowConfirm(true)}
        className="w-full gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar Expediente
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Eliminar expediente"
        description={`¿Estás seguro de que deseas eliminar el expediente "${recordName}"? Esta acción eliminará también todas las notas asociadas y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  );
}
