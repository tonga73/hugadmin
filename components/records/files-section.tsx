"use client";

import { useState, useRef, useCallback } from "react";
import {
  FileText,
  FileImage,
  FileVideo,
  File,
  Download,
  Trash2,
  Upload,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface RecordFile {
  id: number;
  recordId: number | null;
  name: string;
  url: string;
  storagePath: string;
  type: string;
  size: number;
  aiMatch: boolean;
  aiConfidence: number | null;
  createdAt: string;
}

interface FilesSectionProps {
  recordId: number;
  initialFiles: RecordFile[];
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <FileImage className="h-4 w-4" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-4 w-4" />;
  if (mimeType === "application/pdf" || mimeType.includes("word"))
    return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesSection({ recordId, initialFiles }: FilesSectionProps) {
  const [files, setFiles] = useState<RecordFile[]>(initialFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("analyze", "true");

      const res = await fetch(`/api/records/${recordId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir el archivo");

      const newFile = (await res.json()) as RecordFile;
      setFiles((prev) => [newFile, ...prev]);
      return newFile;
    },
    [recordId]
  );

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setIsUploading(true);
      try {
        await Promise.all(Array.from(fileList).map(uploadFile));
        toast.success(
          fileList.length === 1
            ? "Archivo subido correctamente"
            : `${fileList.length} archivos subidos`
        );
      } catch {
        toast.error("Error al subir archivos");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile]
  );

  const handleDelete = useCallback(async (fileId: number) => {
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Error al eliminar el archivo");
      return;
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success("Archivo eliminado");
  }, []);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Archivos adjuntos
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          Subir
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-3 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20"
        }`}
      >
        {files.length === 0 && !isDragging && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Arrastrá archivos aquí o usá el botón Subir
          </p>
        )}

        {isDragging && (
          <p className="text-xs text-primary text-center py-2">
            Soltá para subir
          </p>
        )}

        {files.length > 0 && (
          <ul className="space-y-1">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 text-xs py-1 px-1.5 rounded-lg hover:bg-muted/50 group"
              >
                <span className="text-muted-foreground shrink-0">
                  {fileIcon(f.type)}
                </span>

                <span className="flex-1 truncate min-w-0">
                  {f.name}
                  <span className="ml-1.5 text-muted-foreground/60">
                    {formatBytes(f.size)}
                  </span>
                </span>

                {f.aiMatch && (
                  <Badge
                    variant="outline"
                    className="h-4 text-[9px] px-1 gap-0.5 border-violet-400 text-violet-500 shrink-0"
                    title={`Confianza IA: ${((f.aiConfidence ?? 0) * 100).toFixed(0)}%`}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    IA
                  </Badge>
                )}

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <a href={f.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Download className="h-3 w-3" />
                    </Button>
                  </a>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará <strong>{f.name}</strong> permanentemente
                          tanto del expediente como del almacenamiento.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(f.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
