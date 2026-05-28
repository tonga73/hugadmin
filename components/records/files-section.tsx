"use client";

import { useState, useRef, useCallback } from "react";
import {
  FileText,
  FileImage,
  FileVideo,
  File,
  Download,
  ExternalLink,
  Trash2,
  Upload,
  Sparkles,
  Loader2,
  HardDrive,
  FolderOpen,
  BookOpen,
  ChevronRight,
  FilePlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type FileCategory = "DRIVE" | "APARTADO" | "EXPEDIENTE";

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
  category: FileCategory;
  createdAt: string;
}

interface FilesSectionProps {
  recordId: number;
  initialFiles: RecordFile[];
  apartadoListo?: boolean;
  onToggleApartadoListo?: () => void;
  isTogglingApartadoListo?: boolean;
}

function fileIcon(mimeType: string) {
  if (mimeType === "application/vnd.google-apps.document")
    return <FileText className="h-3.5 w-3.5" />;
  if (mimeType.startsWith("image/")) return <FileImage className="h-3.5 w-3.5" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-3.5 w-3.5" />;
  if (mimeType === "application/pdf" || mimeType.includes("word"))
    return <FileText className="h-3.5 w-3.5" />;
  return <File className="h-3.5 w-3.5" />;
}

function fileUrl(f: RecordFile) {
  if (f.type === "application/vnd.google-apps.document")
    return `https://docs.google.com/document/d/${f.storagePath}/edit`;
  return `https://drive.google.com/file/d/${f.storagePath}/view`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileGroupProps {
  label: string;
  icon: React.ReactNode;
  files: RecordFile[];
  category: FileCategory;
  canUpload: boolean;
  isUploading: boolean;
  defaultOpen?: boolean;
  canCreate?: boolean;
  isCreating?: boolean;
  onUpload: (files: FileList, category: FileCategory) => Promise<void>;
  onDelete: (fileId: number) => Promise<void>;
  onCreateDoc?: (name: string) => Promise<void>;
  apartadoListo?: boolean;
  onToggleApartadoListo?: () => void;
  isTogglingApartadoListo?: boolean;
}

function FileGroup({
  label,
  icon,
  files,
  category,
  canUpload,
  isUploading,
  defaultOpen = true,
  canCreate,
  isCreating,
  onUpload,
  onDelete,
  onCreateDoc,
  apartadoListo,
  onToggleApartadoListo,
  isTogglingApartadoListo,
}: FileGroupProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [createOpen, setCreateOpen] = useState(false);
  const [docName, setDocName] = useState("");

  return (
    <div className="space-y-1">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-muted-foreground/70 hover:text-muted-foreground transition-colors"
        >
          <ChevronRight
            className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
          />
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wider">
            {label}
          </span>
          {files.length > 0 && (
            <span className="text-[10px] bg-muted px-1.5 rounded-full">
              {files.length}
            </span>
          )}
        </button>
        {isOpen && (
          <div className="flex items-center gap-1">
            {onToggleApartadoListo && files.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 text-xs gap-1 px-1.5 transition-colors ${
                  apartadoListo
                    ? "text-emerald-500 hover:text-emerald-600"
                    : "text-muted-foreground/50 hover:text-emerald-400"
                }`}
                onClick={onToggleApartadoListo}
                disabled={isTogglingApartadoListo}
                title={apartadoListo ? "Marcar como no listo" : "Marcar como listo"}
              >
                {isTogglingApartadoListo ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <CheckCircle2 className={`h-2.5 w-2.5 ${apartadoListo ? "fill-emerald-500/20" : ""}`} />
                )}
                {apartadoListo ? "Listo" : "Marcar listo"}
              </Button>
            )}
            {canCreate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-0.5 px-1.5"
                onClick={() => { setDocName(""); setCreateOpen(true); }}
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <FilePlus className="h-2.5 w-2.5" />
                )}
                Nuevo
              </Button>
            )}
            {canUpload && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-0.5 px-1.5"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <Upload className="h-2.5 w-2.5" />
                  )}
                  Subir
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) onUpload(e.target.files, category);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Nuevo documento</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Apartado"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && docName.trim() && onCreateDoc) {
                onCreateDoc(docName.trim()).then(() => setCreateOpen(false));
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!docName.trim() || isCreating}
              onClick={() => {
                if (onCreateDoc && docName.trim()) {
                  onCreateDoc(docName.trim()).then(() => setCreateOpen(false));
                }
              }}
            >
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collapsible content */}
      {isOpen && (
        <div
          onDragOver={canUpload ? (e) => { e.preventDefault(); setIsDragging(true); } : undefined}
          onDragLeave={canUpload ? () => setIsDragging(false) : undefined}
          onDrop={canUpload ? (e) => {
            e.preventDefault();
            setIsDragging(false);
            onUpload(e.dataTransfer.files, category);
          } : undefined}
          className={`rounded-lg border transition-colors ${
            isDragging
              ? "border-primary bg-primary/5 border-solid"
              : files.length === 0
              ? "border-dashed border-muted-foreground/20"
              : "border-transparent"
          }`}
        >
          {files.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 text-center py-3">
              {canUpload ? "Arrastrá o usá Subir" : "Sin archivos"}
            </p>
          ) : (
            <ul className="space-y-0.5">
              {files.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md hover:bg-muted/50 group"
                >
                  <span className="text-muted-foreground shrink-0">
                    {fileIcon(f.type)}
                  </span>

                  <a
                    href={fileUrl(f)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate min-w-0 text-xs hover:underline"
                  >
                    {f.name}
                    {f.size > 0 && (
                      <span className="ml-1 text-muted-foreground/50 text-[11px]">
                        {formatBytes(f.size)}
                      </span>
                    )}
                  </a>

                  {f.aiMatch && (
                    <Badge
                      variant="outline"
                      className="h-3.5 text-[8px] px-1 gap-0.5 border-violet-400 text-violet-500 shrink-0"
                      title={`Confianza IA: ${((f.aiConfidence ?? 0) * 100).toFixed(0)}%`}
                    >
                      <Sparkles className="h-2 w-2" />
                      IA
                    </Badge>
                  )}

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <a
                      href={fileUrl(f)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir"
                    >
                      <Button variant="ghost" size="icon" className="h-4 w-4">
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    </a>
                    {f.type !== "application/vnd.google-apps.document" && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" title="Descargar">
                        <Button variant="ghost" size="icon" className="h-4 w-4">
                          <Download className="h-2.5 w-2.5" />
                        </Button>
                      </a>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará <strong>{f.name}</strong> permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(f.id)}
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
      )}
    </div>
  );
}

export function FilesSection({
  recordId,
  initialFiles,
  apartadoListo,
  onToggleApartadoListo,
  isTogglingApartadoListo,
}: FilesSectionProps) {
  const [files, setFiles] = useState<RecordFile[]>(initialFiles);
  const [uploadingCategory, setUploadingCategory] = useState<FileCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateDoc = useCallback(
    async (name: string) => {
      setIsCreating(true);
      try {
        const res = await fetch(`/api/records/${recordId}/files/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error("Error al crear el documento");
        const file = (await res.json()) as RecordFile;
        setFiles((prev) => [file, ...prev]);
        window.open(file.url, "_blank");
        toast.success("Documento creado");
      } catch {
        toast.error("Error al crear el documento");
      } finally {
        setIsCreating(false);
      }
    },
    [recordId]
  );

  const uploadFiles = useCallback(
    async (fileList: FileList, category: FileCategory) => {
      setUploadingCategory(category);
      try {
        const uploaded = await Promise.all(
          Array.from(fileList).map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", category);
            if (category === "DRIVE") formData.append("analyze", "true");

            const res = await fetch(`/api/records/${recordId}/files`, {
              method: "POST",
              body: formData,
            });

            if (!res.ok) throw new Error("Error al subir el archivo");
            return (await res.json()) as RecordFile;
          })
        );
        setFiles((prev) => [...uploaded, ...prev]);
        toast.success(
          fileList.length === 1
            ? "Archivo subido correctamente"
            : `${fileList.length} archivos subidos`
        );
      } catch {
        toast.error("Error al subir archivos");
      } finally {
        setUploadingCategory(null);
      }
    },
    [recordId]
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

  const driveFiles = files.filter((f) => f.category === "DRIVE");
  const apartadoFiles = files.filter((f) => f.category === "APARTADO");
  const expedienteFiles = files.filter((f) => f.category === "EXPEDIENTE");

  return (
    <div className="space-y-3">
      <FileGroup
        label="Drive"
        icon={<HardDrive className="h-3.5 w-3.5" />}
        files={driveFiles}
        category="DRIVE"
        canUpload={false}
        isUploading={uploadingCategory === "DRIVE"}
        defaultOpen={driveFiles.length > 0}
        onUpload={uploadFiles}
        onDelete={handleDelete}
      />
      <FileGroup
        label="Apartados"
        icon={<FolderOpen className="h-3.5 w-3.5" />}
        files={apartadoFiles}
        category="APARTADO"
        canUpload
        isUploading={uploadingCategory === "APARTADO"}
        defaultOpen={apartadoFiles.length > 0}
        canCreate
        isCreating={isCreating}
        onUpload={uploadFiles}
        onDelete={handleDelete}
        onCreateDoc={handleCreateDoc}
        apartadoListo={apartadoListo}
        onToggleApartadoListo={onToggleApartadoListo}
        isTogglingApartadoListo={isTogglingApartadoListo}
      />
      <FileGroup
        label="Expediente"
        icon={<BookOpen className="h-3.5 w-3.5" />}
        files={expedienteFiles}
        category="EXPEDIENTE"
        canUpload
        isUploading={uploadingCategory === "EXPEDIENTE"}
        defaultOpen={expedienteFiles.length > 0}
        onUpload={uploadFiles}
        onDelete={handleDelete}
      />
    </div>
  );
}
