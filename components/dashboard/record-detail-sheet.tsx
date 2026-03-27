"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import EditableRecordPage from "@/app/(pages)/records/[id]/editable-record-page";
import { TRACING_OPTIONS } from "@/app/constants";
import { Loader2 } from "lucide-react";

interface RecordDetailSheetProps {
  recordId: number | null;
  allowedFileCategories?: string[];
  onClose: () => void;
}

export function RecordDetailSheet({ recordId, allowedFileCategories, onClose }: RecordDetailSheetProps) {
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recordId) {
      setRecord(null);
      return;
    }
    setLoading(true);
    fetch(`/api/records/${recordId}`)
      .then((r) => r.json())
      .then((data) => {
        setRecord({
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          Note: (data.Note ?? []).map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
            updatedAt: new Date(n.updatedAt),
          })),
          files: (data.files ?? []).map((f: any) => ({
            ...f,
            createdAt: new Date(f.createdAt),
          })),
        });
      })
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [recordId]);

  return (
    <Dialog open={recordId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-[95vw] w-full h-[95vh] p-4 flex flex-col overflow-hidden gap-0">
        <DialogTitle className="sr-only">Detalle del expediente</DialogTitle>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : record ? (
          <EditableRecordPage
            record={record}
            tracingOptions={TRACING_OPTIONS}
            allowedFileCategories={allowedFileCategories}
            assignees={(record.RecordsAndUser ?? []).map((r: any) => r.User)}
            onBack={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
