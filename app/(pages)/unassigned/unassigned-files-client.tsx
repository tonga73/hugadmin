"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FileText,
  FileImage,
  FileVideo,
  File,
  Download,
  Sparkles,
  Loader2,
  Trash2,
  RefreshCw,
  Folder,
  FolderOpen,
  ChevronRight,
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
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";

interface RecordFile {
  id: number;
  recordId: number | null;
  name: string;
  url: string;
  storagePath: string;
  folderPath: string | null;
  type: string;
  size: number;
  aiMatch: boolean;
  aiConfidence: number | null;
  createdAt: string;
}

interface RecordOption {
  id: number;
  order: string;
  name: string;
  code: string | null;
}

interface TreeNode {
  name: string;
  fullPath: string;
  files: RecordFile[];
  children: Map<string, TreeNode>;
}

interface Props {
  initialFiles: RecordFile[];
  records: RecordOption[];
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function buildTree(files: RecordFile[]): TreeNode {
  const root: TreeNode = { name: "", fullPath: "", files: [], children: new Map() };

  for (const file of files) {
    const parts = (file.folderPath ?? "").split("/").filter(Boolean);
    let node = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const fullPath = parts.slice(0, i + 1).join("/");
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, fullPath, files: [], children: new Map() });
      }
      node = node.children.get(part)!;
    }

    node.files.push(file);
  }

  return root;
}

function countFiles(node: TreeNode): number {
  let count = node.files.length;
  for (const child of node.children.values()) count += countFiles(child);
  return count;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <FileImage className="h-3.5 w-3.5" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-3.5 w-3.5" />;
  if (mimeType === "application/pdf" || mimeType.includes("word"))
    return <FileText className="h-3.5 w-3.5" />;
  return <File className="h-3.5 w-3.5" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Record combobox ──────────────────────────────────────────────────────────

function RecordCombobox({
  records,
  value,
  onChange,
}: {
  records: RecordOption[];
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selected = records.find((r) => r.id.toString() === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-[190px] justify-between font-normal"
        >
          <span className="truncate">
            {selected ? `${selected.order} — ${selected.name.slice(0, 20)}` : "Asignar a…"}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar expediente…" className="h-8 text-xs" />
          <CommandList className="max-h-48">
            <CommandEmpty className="text-xs py-4 text-center text-muted-foreground">
              No se encontró ningún expediente
            </CommandEmpty>
            {records.map((r) => (
              <CommandItem
                key={r.id}
                value={`${r.order} ${r.name} ${r.code ?? ""}`}
                onSelect={() => {
                  onChange(r.id.toString());
                  setOpen(false);
                }}
                className="text-xs"
              >
                <Check
                  className={cn(
                    "mr-1.5 h-3 w-3 shrink-0",
                    value === r.id.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium mr-1.5">{r.order}</span>
                <span className="truncate text-muted-foreground">{r.name}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── File row ─────────────────────────────────────────────────────────────────

function FileRow({
  file,
  records,
  selectedRecord,
  onSelectRecord,
  onAssign,
  onAnalyze,
  onDelete,
  assigning,
  analyzing,
}: {
  file: RecordFile;
  records: RecordOption[];
  selectedRecord: string;
  onSelectRecord: (val: string) => void;
  onAssign: () => void;
  onAnalyze: () => void;
  onDelete: () => void;
  assigning: boolean;
  analyzing: boolean;
}) {
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border px-3 py-2 text-sm group">
      {/* Icon + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-muted-foreground shrink-0">{fileIcon(file.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium leading-tight">{file.name}</p>
          <p className="text-xs text-muted-foreground/60">{formatBytes(file.size)}</p>
        </div>
        {file.aiMatch && (
          <Badge
            variant="outline"
            className="h-4 text-[9px] px-1 gap-0.5 border-violet-400 text-violet-500 shrink-0"
          >
            <Sparkles className="h-2.5 w-2.5" />
            IA
          </Badge>
        )}
      </div>

      {/* Assign */}
      <div className="flex items-center gap-1.5 shrink-0">
        <RecordCombobox
          records={records}
          value={selectedRecord}
          onChange={onSelectRecord}
        />
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={!selectedRecord || assigning}
          onClick={onAssign}
        >
          {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : "Asignar"}
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={analyzing}
          onClick={onAnalyze}
        >
          {analyzing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          IA
        </Button>

        <a href={file.url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </a>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive/60 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará <strong>{file.name}</strong> de la base de datos.
                El archivo en Drive no se borra.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}

// ─── Folder node (recursive) ──────────────────────────────────────────────────

function FolderNode({
  node,
  depth,
  records,
  selectedRecord,
  onSelectRecord,
  onAssign,
  onAnalyze,
  onDelete,
  assigning,
  analyzing,
}: {
  node: TreeNode;
  depth: number;
  records: RecordOption[];
  selectedRecord: Record<number, string>;
  onSelectRecord: (id: number, val: string) => void;
  onAssign: (fileId: number) => void;
  onAnalyze: (fileId: number) => void;
  onDelete: (fileId: number) => void;
  assigning: number | null;
  analyzing: number | null;
}) {
  const [open, setOpen] = useState(depth === 0);
  const total = countFiles(node);

  const sortedChildren = Array.from(node.children.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div>
      {/* Folder header (not shown for root) */}
      {node.name && (
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors",
            depth === 1 && "text-foreground",
            depth > 1 && "text-muted-foreground"
          )}
          style={{ paddingLeft: `${(depth - 1) * 16 + 8}px` }}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform text-muted-foreground/60",
              open && "rotate-90"
            )}
          />
          {open ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-amber-400" />
          )}
          <span className="truncate">{node.name}</span>
          <span className="ml-auto text-xs text-muted-foreground/60 font-normal shrink-0">
            {total}
          </span>
        </button>
      )}

      {/* Contents */}
      {open && (
        <div style={{ paddingLeft: node.name ? `${depth * 16}px` : 0 }}>
          {/* Subfolders first */}
          {sortedChildren.map((child) => (
            <FolderNode
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              records={records}
              selectedRecord={selectedRecord}
              onSelectRecord={onSelectRecord}
              onAssign={onAssign}
              onAnalyze={onAnalyze}
              onDelete={onDelete}
              assigning={assigning}
              analyzing={analyzing}
            />
          ))}

          {/* Files in this folder */}
          {node.files.length > 0 && (
            <ul className="space-y-1 mt-1 mb-2">
              {node.files.map((f) => (
                <FileRow
                  key={f.id}
                  file={f}
                  records={records}
                  selectedRecord={selectedRecord[f.id] ?? ""}
                  onSelectRecord={(val) => onSelectRecord(f.id, val)}
                  onAssign={() => onAssign(f.id)}
                  onAnalyze={() => onAnalyze(f.id)}
                  onDelete={() => onDelete(f.id)}
                  assigning={assigning === f.id}
                  analyzing={analyzing === f.id}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UnassignedFilesClient({ initialFiles, records }: Props) {
  const [files, setFiles] = useState<RecordFile[]>(initialFiles);
  const [isSyncing, setIsSyncing] = useState(false);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record<number, string>>({});

  const tree = useMemo(() => buildTree(files), [files]);

  const handleSelectRecord = useCallback((id: number, val: string) => {
    setSelectedRecord((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (!res.ok) throw new Error();
      const result = await res.json();

      toast.success(
        `Sync completado — ${result.added} nuevos, ${result.removed} eliminados, ${result.unchanged} sin cambios`
      );

      if (result.added > 0 || result.removed > 0) {
        const filesRes = await fetch("/api/files/unassigned");
        setFiles(await filesRes.json());
      }

      if (result.errors?.length > 0) {
        toast.error(`${result.errors.length} errores durante el sync`);
      }
    } catch {
      toast.error("Error al sincronizar con Drive");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAssign = useCallback(async (fileId: number) => {
    const recordId = selectedRecord[fileId];
    if (!recordId) return;
    setAssigning(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId: parseInt(recordId) }),
      });
      if (!res.ok) throw new Error();
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("Archivo asignado");
    } catch {
      toast.error("Error al asignar");
    } finally {
      setAssigning(null);
    }
  }, [selectedRecord]);

  const handleAnalyze = useCallback(async (fileId: number) => {
    setAnalyzing(fileId);
    try {
      const res = await fetch(`/api/files/${fileId}/analyze`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { file: updated, match } = await res.json();
      if (updated.recordId) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success(`Asignado (confianza: ${((match.confidence ?? 0) * 100).toFixed(0)}%)`);
      } else {
        setFiles((prev) =>
          prev.map((f) => f.id === fileId ? { ...f, aiConfidence: match.confidence } : f)
        );
        toast.info(`Sin match suficiente (${((match.confidence ?? 0) * 100).toFixed(0)}%)`);
      }
    } catch {
      toast.error("Error al analizar");
    } finally {
      setAnalyzing(null);
    }
  }, []);

  const handleDelete = useCallback(async (fileId: number) => {
    const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Error al eliminar"); return; }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success("Eliminado de la DB");
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {files.length === 0
            ? "Todos los archivos están asignados"
            : `${files.length} archivo${files.length !== 1 ? "s" : ""} sin asignar`}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {isSyncing ? "Sincronizando..." : "Sync con Drive"}
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 py-16">
          <p className="text-sm text-muted-foreground">No hay archivos sin asignar</p>
        </div>
      ) : (
        <div className="rounded-xl border p-2">
          <FolderNode
            node={tree}
            depth={0}
            records={records}
            selectedRecord={selectedRecord}
            onSelectRecord={handleSelectRecord}
            onAssign={handleAssign}
            onAnalyze={handleAnalyze}
            onDelete={handleDelete}
            assigning={assigning}
            analyzing={analyzing}
          />
        </div>
      )}
    </div>
  );
}
