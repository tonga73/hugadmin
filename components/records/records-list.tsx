"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getRecords } from "@/app/actions/getRecords";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Record } from "@/app/generated/prisma/client";
import { PRIORITY_OPTIONS, TRACING_OPTIONS } from "@/app/constants";
import { TracingBadge } from "./tracing-badge";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { Skeleton } from "../ui/skeleton";

interface RecordsListProps {
  initialRecords: Record[];
  lastId: number | null;
  hasMore: boolean;
}

export function RecordsList({
  initialRecords,
  lastId,
  hasMore,
}: RecordsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [cursor, setCursor] = useState<number | null>(lastId);
  const [loading, setLoading] = useState<boolean>(false);
  const [more, setMore] = useState<boolean>(hasMore);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLLIElement[]>([]);
  // Sidebar search (local)
  const [query, setQuery] = useState<string>("");
  const [filteredRecords, setFilteredRecords] = useState<Record[]>(records);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(query);
  const [exactMatch, setExactMatch] = useState<boolean>(false);

  // Command palette search (remote)
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState<string>("");
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandResults, setCommandResults] = useState<Record[]>([]);
  const [commandCursor, setCommandCursor] = useState<number | null>(null);
  const [commandHasMore, setCommandHasMore] = useState(false);

  // 🔹 Refrescar lista desde el servidor
  const refreshRecords = async () => {
    try {
      const {
        records: freshRecords,
        lastId: newLastId,
        hasMore: newHasMore,
      } = await getRecords({ take: records.length || 10 });

      setRecords(freshRecords as any);
      setCursor(newLastId);
      setMore(newHasMore);
      // actualizar filtro cuando los registros cambian
      applyFilter(query, freshRecords as any);
    } catch (error) {
      console.error("Error refreshing records:", error);
    }
  };

  // Aplica filtro local sobre una lista dada
  const applyFilter = (q: string, source: Record[]) => {
    const normalized = q.trim();
    if (!normalized) {
      setFilteredRecords(source);
      setSelectedIndex(0);
      return;
    }

    const terms = normalized
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const filtered = source.filter((r) => {
      const tracingLabel =
        TRACING_OPTIONS[r.tracing as keyof typeof TRACING_OPTIONS]?.label ||
        String(r.tracing || "");
      const defendants = Array.isArray(r.defendant)
        ? r.defendant.join(" ")
        : String(r.defendant || "");
      const prosecutors = Array.isArray(r.prosecutor)
        ? r.prosecutor.join(" ")
        : String(r.prosecutor || "");
      const insurances = Array.isArray(r.insurance)
        ? r.insurance.join(" ")
        : String(r.insurance || "");

      const haystack = (
        String(r.order) +
        " " +
        (r.name || "") +
        " " +
        tracingLabel +
        " " +
        defendants +
        " " +
        prosecutors +
        " " +
        insurances
      ).toLowerCase();

      if (!exactMatch) {
        // fuzzy: any term included anywhere
        return terms.some((t) => haystack.includes(t.toLowerCase()));
      }

      // exact/whole-word: match with word boundaries for any term
      return terms.some((t) => {
        try {
          const re = new RegExp("\\b" + escapeRegExp(t.toLowerCase()) + "\\b");
          return re.test(haystack);
        } catch (e) {
          // fallback to includes if regex fails
          return haystack.includes(t.toLowerCase());
        }
      });
    });

    setFilteredRecords(filtered);
    setSelectedIndex(0);
  };

  // utility: escape regex special chars
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Debounce del query para sidebar
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    applyFilter(debouncedQuery, records);
  }, [debouncedQuery, records]);

  // 🔹 Escuchar eventos de creación
  useEffect(() => {
    const handleNewRecord = (e: Event) => {
      const customEvent = e as CustomEvent<Record>;
      setRecords((prev) => [customEvent.detail, ...prev]);
    };

    window.addEventListener("new-record", handleNewRecord);
    return () => {
      window.removeEventListener("new-record", handleNewRecord);
    };
  }, []);

  // 🔹 Escuchar eventos de actualización
  useEffect(() => {
    const handleUpdateRecord = (e: Event) => {
      const customEvent = e as CustomEvent<Record>;
      const updatedRecord = customEvent.detail;

      // Actualizar en la lista local
      setRecords((prev) =>
        prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
      );
    };

    window.addEventListener("update-record", handleUpdateRecord);
    return () => {
      window.removeEventListener("update-record", handleUpdateRecord);
    };
  }, []);

  // Mantener filteredRecords sincronizado cuando cambian records
  useEffect(() => {
    applyFilter(query, records);
  }, [records]);

  // 🔹 Polling ligero para sincronizar cambios (opcional)
  useEffect(() => {
    const interval = setInterval(() => {
      // Solo refrescar si no estamos cargando
      if (!loading) {
        refreshRecords();
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [loading, records.length]);

  // 🔹 Infinite scroll
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && more && !loading) {
          setLoading(true);
          const {
            records: newRecords,
            lastId: newCursor,
            hasMore,
          } = await getRecords({
            cursor: cursor ?? undefined,
            take: 10,
          });
          setRecords((prev) => [...prev, ...(newRecords as any)]);
          setCursor(newCursor);
          setMore(hasMore);
          setLoading(false);
        }
      },
      { root: viewport, rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, loading, more]);

  // 🔹 Determinar índice del item seleccionado según la ruta
  useEffect(() => {
    // buscar dentro de la lista filtrada para que la selección y navegación por teclado funcionen con el filtro aplicado
    const currentIndex = filteredRecords.findIndex(
      (r) => `/records/${r.id}` === pathname
    );
    setSelectedIndex(currentIndex);
  }, [pathname, filteredRecords]);

  // 🔹 Manejo de teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!filteredRecords.length) return;

      if (e.key === "ArrowDown") {
        const nextIndex = Math.min(
          selectedIndex + 1,
          filteredRecords.length - 1
        );
        // solo navegar si el índice existe
        if (nextIndex >= 0 && nextIndex < filteredRecords.length) {
          router.push(`/records/${filteredRecords[nextIndex].id}`);
        }
      } else if (e.key === "ArrowUp") {
        const prevIndex = Math.max(selectedIndex - 1, 0);
        if (prevIndex >= 0 && prevIndex < filteredRecords.length) {
          router.push(`/records/${filteredRecords[prevIndex].id}`);
        }
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < filteredRecords.length) {
          router.push(`/records/${filteredRecords[selectedIndex].id}`);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filteredRecords, selectedIndex, router]);

  // 🔹 Click en item
  const handleClick = (index: number) => {
    const record = filteredRecords[index];
    const targetPath = `/records/${record.id}`;
    if (pathname === targetPath) {
      router.push("/");
    } else {
      router.push(targetPath);
    }
  };

  // Scroll to highlighted record when navigating from command palette
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId && scrollRef.current) {
      const highlightNumId = parseInt(highlightId, 10);
      // Encuentra el índice del record a highlight en la lista filtrada
      const index = filteredRecords.findIndex((r) => r.id === highlightNumId);
      if (index >= 0 && itemsRef.current[index]) {
        // Scroll into view
        itemsRef.current[index].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // Highlight visual
        setSelectedIndex(index);
      }
    }
  }, [searchParams, filteredRecords]);

  // Precompute recent records (last modified)
  const { useCallback } = require("react");
  const recentRecords = useMemo(
    () =>
      [...records]
        .sort(
          (a, b) =>
            (new Date(b.updatedAt || b.createdAt).getTime() || 0) -
            (new Date(a.updatedAt || a.createdAt).getTime() || 0)
        )
        .slice(0, 5),
    [records]
  );

  // Filtro local para sugeridos recientes (MUST be memoized to avoid infinite loops)
  const filterLocalRecent = useCallback(
    (q: string) => {
      const normalized = q.trim().toLowerCase();
      const terms = normalized.split(/\s+/).filter(Boolean);
      return recentRecords.filter((r) => {
        const tracingLabel =
          TRACING_OPTIONS[
            r.tracing as keyof typeof TRACING_OPTIONS
          ]?.label?.toLowerCase() || String(r.tracing || "").toLowerCase();
        const defendants = Array.isArray(r.defendant)
          ? r.defendant.join(" ").toLowerCase()
          : String(r.defendant || "").toLowerCase();
        const prosecutors = Array.isArray(r.prosecutor)
          ? r.prosecutor.join(" ").toLowerCase()
          : String(r.prosecutor || "").toLowerCase();
        const insurances = Array.isArray(r.insurance)
          ? r.insurance.join(" ").toLowerCase()
          : String(r.insurance || "").toLowerCase();
        const haystack = (
          String(r.order) +
          " " +
          (r.name || "") +
          " " +
          tracingLabel +
          " " +
          defendants +
          " " +
          prosecutors +
          " " +
          insurances
        ).toLowerCase();
        return terms.some((t) => haystack.includes(t));
      });
    },
    [recentRecords]
  );

  // Command palette: búsqueda remota y fallback local
  useEffect(() => {
    let active = true;
    const fetch = async () => {
      console.log("🔄 useEffect triggered, commandQuery:", commandQuery); // DEBUG
      if (!commandQuery || !commandQuery.trim()) {
        setCommandResults(recentRecords);
        setCommandLoading(false);
        setCommandCursor(null);
        setCommandHasMore(false);
        return;
      }
      setCommandLoading(true);
      try {
        console.log("🔍 Fetching with query:", commandQuery); // DEBUG
        const {
          records: found,
          lastId,
          hasMore,
        } = await getRecords({
          query: commandQuery,
          take: 100,
          exactMatch,
        });
        if (active) {
          setCommandResults(
            found.length > 0 ? found : filterLocalRecent(commandQuery)
          );
          setCommandCursor(lastId);
          setCommandHasMore(hasMore);
        }
      } catch (e) {
        if (active) {
          setCommandResults(filterLocalRecent(commandQuery));
          setCommandCursor(null);
          setCommandHasMore(false);
        }
      } finally {
        if (active) setCommandLoading(false);
      }
    };
    fetch();
    return () => {
      active = false;
    };
  }, [commandQuery, exactMatch, recentRecords, filterLocalRecent]);

  // Función para cargar más resultados en el Command palette
  const loadMoreCommandResults = async () => {
    if (!commandCursor || !commandQuery) return;
    setCommandLoading(true);
    try {
      const {
        records: found,
        lastId,
        hasMore,
      } = await getRecords({
        cursor: commandCursor,
        query: commandQuery,
        take: 100,
        exactMatch,
      });
      setCommandResults((prev) => [...prev, ...(found as any)]);
      setCommandCursor(lastId);
      setCommandHasMore(hasMore);
    } catch (e) {
      console.error("Error loading more:", e);
    } finally {
      setCommandLoading(false);
    }
  };

  // keyboard shortcut to open command (Cmd/Ctrl+K)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  console.log(
    "🏁 Component render, commandResults.length:",
    commandResults.length,
    "commandQuery:",
    commandQuery
  ); // DEBUG

  return (
    <div className="w-full">
      {/* Trigger (sticky at top of sidebar area) */}
      <div className="sticky top-0 z-20 bg-background px-2 py-3">
        <button
          className="flex items-center gap-2 w-full rounded-md border px-3 py-2 text-sm bg-transparent"
          onClick={() => setCommandOpen(true)}
          aria-label="Buscar expedientes (Cmd/Ctrl+K)"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Buscar...</span>
          <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
        </button>
        <CommandDialog
          open={commandOpen}
          onOpenChange={(open) => {
            setCommandOpen(open);
            if (!open) setCommandQuery("");
          }}
          className="top-0 left-0 translate-x-0 translate-y-0 w-full h-full max-w-none rounded-none p-0"
        >
          <CommandInput
            value={commandQuery}
            onValueChange={(v: string) => {
              setCommandQuery(v);
            }}
            placeholder="Buscar por orden, nombre o tracing..."
          />
          {/* Use ScrollArea instead of CommandList for proper dynamic rendering */}
          <ScrollArea className="h-[calc(100vh-100px)] w-full">
            <div className="w-full">
              {commandLoading && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Buscando...
                </div>
              )}
              {!commandLoading && commandResults.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No se encontraron expedientes.
                </div>
              )}
              {!commandLoading && commandResults.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs text-muted-foreground sticky top-0 bg-background">
                    {commandQuery && commandQuery.trim() !== ""
                      ? `Resultados para "${commandQuery}"`
                      : "Últimos modificados"}
                  </div>
                  <div className="divide-y">
                    {commandResults.map((r) => {
                      return (
                        <button
                          key={r.id}
                          onClick={() => {
                            setCommandOpen(false);
                            // Push con hash para marcar el record a scrollear
                            router.push(`/records/${r.id}?highlight=${r.id}`);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">
                                {r.order} — {r.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                <TracingBadge
                                  tracing={r.tracing as any}
                                  className="inline-block mr-2"
                                />
                                {TRACING_OPTIONS[
                                  r.tracing as keyof typeof TRACING_OPTIONS
                                ]?.label || r.tracing}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0">
                              {typeof r.updatedAt === "string"
                                ? new Date(r.updatedAt).toLocaleString()
                                : r.updatedAt
                                ? new Date(r.createdAt).toLocaleString()
                                : ""}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {commandHasMore && (
                    <div className="px-3 py-3 border-t">
                      <button
                        onClick={loadMoreCommandResults}
                        disabled={commandLoading}
                        className="w-full py-2 px-3 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                      >
                        {commandLoading ? "Cargando..." : "Cargar más"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </CommandDialog>
      </div>

      <ScrollArea className="h-[calc(100vh-230px)]" ref={scrollRef}>
        <SidebarMenu>
          {filteredRecords.map((itemToRender, index) => {
            const isSelected = selectedIndex === index;
            return (
              <SidebarMenuItem
                key={itemToRender.id}
                ref={(el) => {
                  if (el) itemsRef.current[index] = el;
                }}
                className={`transition-colors cursor-pointer ${
                  isSelected ? "bg-gray-200 dark:bg-gray-700 font-semibold" : ""
                }`}
                style={{
                  borderLeft: `3px solid ${
                    PRIORITY_OPTIONS[itemToRender.priority].color
                  }`,
                }}
              >
                <SidebarMenuButton asChild className="h-auto max-h-full">
                  <a
                    className="flex flex-col items-start justify-start"
                    onClick={() => handleClick(index)}
                  >
                    <span className="flex items-center justify-between gap-1.5">
                      <p>{itemToRender.order}</p>
                      <TracingBadge
                        tracing={itemToRender.tracing}
                        className="max-w-32"
                      />
                    </span>
                    <span className="uppercase">{itemToRender.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        {more && <div ref={sentinelRef} className="h-6" />}
        {loading && <Skeleton className="w-full h-14 mt-1.5 animate-pulse" />}
        {!more && records.length > 0 && (
          <div className="py-2 text-center text-sm text-muted-foreground">
            No hay más expedientes
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
