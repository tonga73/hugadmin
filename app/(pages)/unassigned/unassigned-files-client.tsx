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
import { ChevronsUpDown, Check, Search, X } from "lucide-react";

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

function collectFileIds(node: TreeNode): number[] {
  const ids = node.files.map((f) => f.id);
  for (const child of node.children.values()) ids.push(...collectFileIds(child));
  return ids;
}

function filterTree(node: TreeNode, query: string): TreeNode {
  if (!query) return node;
  const q = query.toLowerCase();

  const matchingFiles = node.files.filter((f) => f.name.toLowerCase().includes(q));

  const matchingChildren = new Map<string, TreeNode>();
  for (const [key, child] of node.children) {
    if (child.name.toLowerCase().includes(q)) {
      // Folder name matches — include entire subtree
      matchingChildren.set(key, child);
    } else {
      const filtered = filterTree(child, query);
      if (countFiles(filtered) > 0) matchingChildren.set(key, filtered);
    }
  }

  return { ...node, files: matchingFiles, children: matchingChildren };
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

// ─── Folder assign button ─────────────────────────────────────────────────────

function FolderAssignButton({
  node,
  records,
  onAssigned,
}: {
  node: TreeNode;
  records: RecordOption[];
  onAssigned: (fileIds: number[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const total = countFiles(node);

  const handleAssign = async () => {
    if (!selectedId) return;
    setIsAssigning(true);
    try {
      const fileIds = collectFileIds(node);
      const res = await fetch("/api/files/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds, recordId: parseInt(selectedId) }),
      });
      if (!res.ok) throw new Error();
      onAssigned(fileIds);
      setOpen(false);
      setSelectedId("");
      toast.success(`${fileIds.length} archivo${fileIds.length !== 1 ? "s" : ""} asignados`);
    } catch {
      toast.error("Error al asignar la carpeta");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedId(""); setSearch(""); } }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-2"
          onClick={(e) => e.stopPropagation()}
        >
          <FolderOpen className="h-3 w-3" />
          Asignar carpeta ({total})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-3" align="start" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-medium mb-2">
          Asignar <span className="text-muted-foreground">{node.name}</span> ({total} archivos)
        </p>
        <Command>
          <CommandInput
            placeholder="Buscar expediente…"
            className="h-8 text-xs"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-44">
            <CommandEmpty className="text-xs py-3 text-center text-muted-foreground">
              No se encontró ningún expediente
            </CommandEmpty>
            {records.map((r) => (
              <CommandItem
                key={r.id}
                value={`${r.order} ${r.name} ${r.code ?? ""}`}
                onSelect={() => setSelectedId(r.id.toString())}
                className="text-xs"
              >
                <Check
                  className={cn(
                    "mr-1.5 h-3 w-3 shrink-0",
                    selectedId === r.id.toString() ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="font-medium mr-1.5">{r.order}</span>
                <span className="truncate text-muted-foreground">{r.name}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
        <Button
          size="sm"
          className="w-full mt-2 h-7 text-xs"
          disabled={!selectedId || isAssigning}
          onClick={handleAssign}
        >
          {isAssigning ? <Loader2 className="h-3 w-3 animate-spin" /> : `Asignar ${total} archivos`}
        </Button>
      </PopoverContent>
    </Popover>
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
  onFolderAssigned,
  assigning,
  analyzing,
  searchActive,
}: {
  node: TreeNode;
  depth: number;
  records: RecordOption[];
  selectedRecord: Record<number, string>;
  onSelectRecord: (id: number, val: string) => void;
  onAssign: (fileId: number) => void;
  onAnalyze: (fileId: number) => void;
  onDelete: (fileId: number) => void;
  onFolderAssigned: (fileIds: number[]) => void;
  assigning: number | null;
  analyzing: number | null;
  searchActive: boolean;
}) {
  const [open, setOpen] = useState(depth === 0);
  const total = countFiles(node);
  const isOpen = searchActive || open;

  const sortedChildren = Array.from(node.children.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div>
      {/* Folder header (not shown for root) */}
      {node.name && (
        <div
          className="group flex items-center rounded-lg hover:bg-muted/60 transition-colors"
          style={{ paddingLeft: `${(depth - 1) * 16 + 8}px` }}
        >
          <button
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "flex-1 flex items-center gap-2 py-1.5 text-sm font-medium min-w-0",
              depth === 1 && "text-foreground",
              depth > 1 && "text-muted-foreground"
            )}
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-transform text-muted-foreground/60",
                isOpen && "rotate-90"
              )}
            />
            {isOpen ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-amber-400" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-amber-400" />
            )}
            <span className="truncate">{node.name}</span>
            <span className="ml-2 text-xs text-muted-foreground/60 font-normal shrink-0">
              {total}
            </span>
          </button>
          <div className="pr-2 shrink-0">
            <FolderAssignButton
              node={node}
              records={records}
              onAssigned={onFolderAssigned}
            />
          </div>
        </div>
      )}

      {/* Contents */}
      {isOpen && (
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
              onFolderAssigned={onFolderAssigned}
              assigning={assigning}
              analyzing={analyzing}
              searchActive={searchActive}
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

  const [search, setSearch] = useState("");

  const tree = useMemo(() => buildTree(files), [files]);
  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);

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

  const handleFolderAssigned = useCallback((fileIds: number[]) => {
    const idSet = new Set(fileIds);
    setFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar archivos o carpetas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-8 text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
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
      <p className="text-xs text-muted-foreground">
        {files.length === 0
          ? "Todos los archivos están asignados"
          : search
          ? `${countFiles(filteredTree)} resultado${countFiles(filteredTree) !== 1 ? "s" : ""} de ${files.length} archivos`
          : `${files.length} archivo${files.length !== 1 ? "s" : ""} sin asignar`}
      </p>

      {files.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 py-16">
          <p className="text-sm text-muted-foreground">No hay archivos sin asignar</p>
        </div>
      ) : (
        <div className="rounded-xl border p-2">
          <FolderNode
            node={filteredTree}
            depth={0}
            records={records}
            selectedRecord={selectedRecord}
            onSelectRecord={handleSelectRecord}
            onAssign={handleAssign}
            onAnalyze={handleAnalyze}
            onDelete={handleDelete}
            onFolderAssigned={handleFolderAssigned}
            assigning={assigning}
            analyzing={analyzing}
            searchActive={!!search}
          />
        </div>
      )}
    </div>
  );
}
