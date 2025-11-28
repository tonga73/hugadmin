"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Record } from "@/app/generated/prisma/client";
import { getRecords } from "@/app/actions/getRecords";
import {
  filterRecords,
  mergeUniqueRecords,
  recordExists,
} from "@/lib/record-search";

interface UseRecordsListProps {
  initialRecords: Record[];
  lastId: number | null;
  hasMore: boolean;
}

export function useRecordsList({
  initialRecords,
  lastId,
  hasMore,
}: UseRecordsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado principal de records
  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [cursor, setCursor] = useState<number | null>(lastId);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(hasMore);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLLIElement[]>([]);
  const highlightedRef = useRef<HTMLDivElement>(null);

  // Búsqueda local
  const [pinnedQuery, setPinnedQuery] = useState("");
  const [filteredRecords, setFilteredRecords] = useState<Record[]>(records);
  const [exactMatch] = useState(false);

  // Record destacado temporal
  const [highlightedRecord, setHighlightedRecord] = useState<Record | null>(
    null
  );

  // Command palette
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandResults, setCommandResults] = useState<Record[]>([]);
  const [commandCursor, setCommandCursor] = useState<number | null>(null);
  const [commandHasMore, setCommandHasMore] = useState(false);
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(0);
  const commandItemsRef = useRef<HTMLButtonElement[]>([]);

  // Records recientes (últimos modificados)
  const recentRecords = useMemo(
    () =>
      [...records]
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        )
        .slice(0, 5),
    [records]
  );

  // Aplicar filtro
  useEffect(() => {
    const query = pinnedQuery.trim();
    if (query) {
      setFilteredRecords(filterRecords(records, query, exactMatch));
    } else {
      setFilteredRecords(records);
    }
    setSelectedIndex(0);
  }, [pinnedQuery, records, exactMatch]);

  // Limpiar búsqueda fijada
  const clearPinnedSearch = useCallback(() => {
    setPinnedQuery("");
    setCommandQuery("");
  }, []);

  // Destacar record si no está en la lista
  const ensureRecordInList = useCallback(
    (record: Record) => {
      const existsInFiltered = recordExists(filteredRecords, record.id);
      setHighlightedRecord(existsInFiltered ? null : record);
    },
    [filteredRecords]
  );

  // Refrescar records desde el servidor
  const refreshRecords = useCallback(async () => {
    try {
      const {
        records: freshRecords,
        lastId: newLastId,
        hasMore: newHasMore,
      } = await getRecords({ take: records.length || 10 });

      setRecords(freshRecords as Record[]);
      setCursor(newLastId);
      setMore(newHasMore);
    } catch (error) {
      console.error("Error refreshing records:", error);
    }
  }, [records.length]);

  // Scroll a un item específico
  const scrollToItem = useCallback((index: number) => {
    if (index >= 0 && itemsRef.current[index]) {
      itemsRef.current[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, []);

  // Click en item de la lista
  const handleItemClick = useCallback(
    (index: number) => {
      const record = filteredRecords[index];
      const targetPath = `/records/${record.id}`;
      router.push(pathname === targetPath ? "/" : targetPath);
    },
    [filteredRecords, pathname, router]
  );

  // Seleccionar record desde Command
  const handleCommandSelect = useCallback(
    (record: Record) => {
      ensureRecordInList(record);
      if (commandQuery.trim()) {
        setPinnedQuery(commandQuery);
      }
      setCommandOpen(false);
      router.push(`/records/${record.id}?highlight=${record.id}`);
    },
    [commandQuery, ensureRecordInList, router]
  );

  // Cargar más resultados del Command
  const loadMoreCommandResults = useCallback(async () => {
    if (!commandCursor || !commandQuery) return;
    setCommandLoading(true);
    try {
      const { records: found, lastId, hasMore } = await getRecords({
        cursor: commandCursor,
        query: commandQuery,
        take: 100,
        exactMatch,
      });
      setCommandResults((prev) => mergeUniqueRecords(prev, found as Record[]));
      setCommandCursor(lastId);
      setCommandHasMore(hasMore);
    } catch (error) {
      console.error("Error loading more:", error);
    } finally {
      setCommandLoading(false);
    }
  }, [commandCursor, commandQuery, exactMatch]);

  // Event listeners para new-record, update-record y delete-record
  useEffect(() => {
    const handleNewRecord = (e: Event) => {
      const { detail: newRecord } = e as CustomEvent<Record>;
      setRecords((prev) =>
        recordExists(prev, newRecord.id) ? prev : [newRecord, ...prev]
      );
    };

    const handleUpdateRecord = (e: Event) => {
      const { detail: updated } = e as CustomEvent<Record>;
      // Mover el record actualizado al inicio de la lista
      setRecords((prev) => {
        const filtered = prev.filter((r) => r.id !== updated.id);
        return [updated, ...filtered];
      });
    };

    const handleDeleteRecord = (e: Event) => {
      const { detail } = e as CustomEvent<{ id: number | string }>;
      const deletedId = Number(detail.id);
      setRecords((prev) => prev.filter((r) => Number(r.id) !== deletedId));
      // También limpiar el highlightedRecord si es el eliminado
      setHighlightedRecord((prev) =>
        prev && Number(prev.id) === deletedId ? null : prev
      );
    };

    window.addEventListener("new-record", handleNewRecord);
    window.addEventListener("update-record", handleUpdateRecord);
    window.addEventListener("delete-record", handleDeleteRecord);
    return () => {
      window.removeEventListener("new-record", handleNewRecord);
      window.removeEventListener("update-record", handleUpdateRecord);
      window.removeEventListener("delete-record", handleDeleteRecord);
    };
  }, []);

  // Polling para sincronizar cambios
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) refreshRecords();
    }, 30000);
    return () => clearInterval(interval);
  }, [loading, refreshRecords]);

  // Infinite scroll
  useEffect(() => {
    const viewport = scrollRef.current?.querySelector<HTMLElement>(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && more && !loading) {
          setLoading(true);
          const {
            records: newRecords,
            lastId: newCursor,
            hasMore,
          } = await getRecords({ cursor: cursor ?? undefined, take: 10 });

          setRecords((prev) => mergeUniqueRecords(prev, newRecords as Record[]));
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

  // Actualizar selectedIndex según pathname
  useEffect(() => {
    const index = filteredRecords.findIndex(
      (r) => `/records/${r.id}` === pathname
    );
    setSelectedIndex(index);
  }, [pathname, filteredRecords]);

  // Limpiar highlightedRecord cuando se navega a otro lugar
  useEffect(() => {
    if (
      highlightedRecord &&
      pathname !== `/records/${highlightedRecord.id}`
    ) {
      setHighlightedRecord(null);
    }
  }, [pathname, highlightedRecord]);

  // Keyboard shortcut para abrir Command (Cmd/Ctrl+K)
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

  // Navegación por teclado en la lista (deshabilitada cuando Command está abierto)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (commandOpen || !filteredRecords.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(selectedIndex + 1, filteredRecords.length - 1);
        if (nextIndex >= 0) {
          router.push(`/records/${filteredRecords[nextIndex].id}`);
          setTimeout(() => scrollToItem(nextIndex), 50);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = Math.max(selectedIndex - 1, 0);
        if (prevIndex >= 0) {
          router.push(`/records/${filteredRecords[prevIndex].id}`);
          setTimeout(() => scrollToItem(prevIndex), 50);
        }
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        router.push(`/records/${filteredRecords[selectedIndex].id}`);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filteredRecords, selectedIndex, router, commandOpen, scrollToItem]);

  // Navegación por teclado en el Command
  useEffect(() => {
    if (!commandOpen) return;

    const handleCommandKey = (e: KeyboardEvent) => {
      if (!commandResults.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCommandSelectedIndex((prev) =>
          Math.min(prev + 1, commandResults.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCommandSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = commandResults[commandSelectedIndex];
        if (selected) handleCommandSelect(selected);
      } else if (e.key === "Escape" && commandQuery.trim()) {
        setPinnedQuery(commandQuery);
      }
    };

    window.addEventListener("keydown", handleCommandKey);
    return () => window.removeEventListener("keydown", handleCommandKey);
  }, [
    commandOpen,
    commandResults,
    commandSelectedIndex,
    commandQuery,
    handleCommandSelect,
  ]);

  // Resetear índice del Command cuando cambian los resultados
  useEffect(() => {
    setCommandSelectedIndex(0);
  }, [commandResults]);

  // Scroll al item seleccionado en el Command
  useEffect(() => {
    if (commandOpen && commandItemsRef.current[commandSelectedIndex]) {
      commandItemsRef.current[commandSelectedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [commandSelectedIndex, commandOpen]);

  // Búsqueda en el Command
  useEffect(() => {
    let active = true;

    const fetchResults = async () => {
      if (!commandQuery?.trim()) {
        setCommandResults(recentRecords);
        setCommandLoading(false);
        setCommandCursor(null);
        setCommandHasMore(false);
        return;
      }

      setCommandLoading(true);
      try {
        const { records: found, lastId, hasMore } = await getRecords({
          query: commandQuery,
          take: 100,
          exactMatch,
        });

        if (active) {
          setCommandResults(
            found.length > 0
              ? (found as Record[])
              : filterRecords(recentRecords, commandQuery)
          );
          setCommandCursor(lastId);
          setCommandHasMore(hasMore);
        }
      } catch {
        if (active) {
          setCommandResults(filterRecords(recentRecords, commandQuery));
          setCommandCursor(null);
          setCommandHasMore(false);
        }
      } finally {
        if (active) setCommandLoading(false);
      }
    };

    fetchResults();
    return () => {
      active = false;
    };
  }, [commandQuery, exactMatch, recentRecords]);

  // Scroll al record destacado cuando viene del Command
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId || !scrollRef.current) return;

    const highlightNumId = parseInt(highlightId, 10);
    const timeoutId = setTimeout(() => {
      if (
        highlightedRecord &&
        Number(highlightedRecord.id) === highlightNumId &&
        highlightedRef.current
      ) {
        highlightedRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      const index = filteredRecords.findIndex((r) => r.id === highlightNumId);
      if (index >= 0 && itemsRef.current[index]) {
        itemsRef.current[index].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setSelectedIndex(index);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchParams, filteredRecords, highlightedRecord]);

  // Manejar cierre del Command
  const handleCommandClose = useCallback(
    (open: boolean) => {
      setCommandOpen(open);
      if (!open) {
        if (commandQuery.trim() && commandResults.length > 0) {
          setPinnedQuery(commandQuery);
        }
        setCommandQuery("");
        setCommandSelectedIndex(0);
      }
    },
    [commandQuery, commandResults.length]
  );

  return {
    // State
    records,
    filteredRecords,
    selectedIndex,
    loading,
    more,
    pinnedQuery,
    highlightedRecord,
    // Command state
    commandOpen,
    commandQuery,
    commandLoading,
    commandResults,
    commandHasMore,
    commandSelectedIndex,
    // Refs
    scrollRef,
    sentinelRef,
    itemsRef,
    highlightedRef,
    commandItemsRef,
    // Actions
    setCommandQuery,
    setCommandSelectedIndex,
    setHighlightedRecord,
    handleItemClick,
    handleCommandSelect,
    handleCommandClose,
    loadMoreCommandResults,
    clearPinnedSearch,
    ensureRecordInList,
    // Router
    router,
    pathname,
  };
}

