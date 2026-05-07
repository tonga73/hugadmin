"use client";

import { useEffect, useRef, useState, useMemo, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Record } from "@/app/generated/prisma/client";
import { getRecords } from "@/app/actions/getRecords";
import {
  filterRecords,
  mergeUniqueRecords,
  recordExists,
} from "@/lib/record-search";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Helper para convertir fechas de string a Date (necesario porque JSON serializa Date como string)
const parseRecordDates = (record: any): Record => ({
  ...record,
  createdAt: record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt),
  updatedAt: record.updatedAt instanceof Date ? record.updatedAt : new Date(record.updatedAt),
});

const parseRecordsDates = (records: any[]): Record[] => records.map(parseRecordDates);

interface UseRecordsListProps {
  initialRecords: Record[];
  lastId: number | null;
  hasMore: boolean;
  initialTracingFilter?: string[];
  initialMinPriority?: string | null;
  initialMine?: boolean;
  initialFavoritesOnly?: boolean;
  priorityPreload?: boolean;
}

export function useRecordsList({
  initialRecords,
  lastId,
  hasMore,
  initialTracingFilter = [],
  initialMinPriority = null,
  initialMine = false,
  initialFavoritesOnly = false,
  priorityPreload = false,
}: UseRecordsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

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
  const lastScrolledHighlightRef = useRef<string | null>(null); // Track último highlight scrolleado

  // Filtros de lista — inicializados desde URL params si existen, si no desde props (DB config)
  const [tracingFilter, setTracingFilter] = useState<string[]>(() => {
    const lt = searchParams.get("lt");
    return lt !== null ? lt.split(",").filter(Boolean) : initialTracingFilter;
  });
  const [minPriority, setMinPriority] = useState<string | null>(() => {
    const lp = searchParams.get("lp");
    return lp !== null ? (lp || null) : initialMinPriority;
  });
  // mine y favoritesOnly: URL param tiene prioridad; si ausente, usa prop inicial (DB config)
  const urlMine = searchParams.get("lm");
  const mine = urlMine !== null ? urlMine === "1" : initialMine;

  const urlFav = searchParams.get("lf");
  const favoritesOnly = urlFav !== null ? urlFav === "1" : initialFavoritesOnly;

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
  const shouldScrollCommandRef = useRef(false); // Solo scroll cuando navega con teclado

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

  // Aplicar filtros (solo búsqueda local — tracing/prioridad/mine son server-side)
  useEffect(() => {
    let result = records;
    const query = pinnedQuery.trim();
    if (query) {
      result = filterRecords(result, query, exactMatch);
    }
    setFilteredRecords(result);
  }, [pinnedQuery, records, exactMatch]);

  // Resetear selectedIndex solo cuando cambia el query de búsqueda
  useEffect(() => {
    setSelectedIndex(0);
  }, [pinnedQuery]);

  // Ref con filtros actuales para uso en efectos async (infinite scroll, polling)
  const filtersRef = useRef({ tracingFilter, minPriority, mine, favoritesOnly });
  useEffect(() => {
    filtersRef.current = { tracingFilter, minPriority, mine, favoritesOnly };
  }, [tracingFilter, minPriority, mine, favoritesOnly]);

  // Re-fetch del servidor cuando cambian los filtros (skip primer render)
  const filtersInitialized = useRef(false);
  useEffect(() => {
    if (!filtersInitialized.current) {
      filtersInitialized.current = true;
      return;
    }
    let cancelled = false;
    const reload = async () => {
      setLoading(true);
      setRecords([]);
      try {
        const { records: fresh, lastId: newLastId, hasMore: newHasMore } = await getRecords({
          take: 20,
          explicitFilters: { tracingFilter, minPriority, mine, favoritesOnly },
          priorityPreload,
        });
        if (!cancelled) {
          setRecords(parseRecordsDates(fresh));
          setCursor(newLastId);
          setMore(newHasMore);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    reload();
    return () => { cancelled = true; };
  }, [tracingFilter, minPriority, mine, favoritesOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper para actualizar URL params de filtros
  const updateFilterUrl = useCallback((updates: {
    tracingFilter?: string[];
    minPriority?: string | null;
    mine?: boolean;
    favoritesOnly?: boolean;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.tracingFilter !== undefined) {
      if (updates.tracingFilter.length > 0) params.set("lt", updates.tracingFilter.join(","));
      else params.delete("lt");
    }
    if ("minPriority" in updates) {
      if (updates.minPriority) params.set("lp", updates.minPriority);
      else params.delete("lp");
    }
    if (updates.mine !== undefined) {
      if (updates.mine) params.set("lm", "1");
      else params.delete("lm");
    }
    if (updates.favoritesOnly !== undefined) {
      if (updates.favoritesOnly) params.set("lf", "1");
      else params.delete("lf");
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false } as any);
    });
  }, [searchParams, pathname, router, startTransition]);

  // Actualizar filtro de tracing — actualiza estado + URL + guarda en DB
  const updateTracingFilter = useCallback((newFilter: string[]) => {
    setTracingFilter(newFilter);
    updateFilterUrl({ tracingFilter: newFilter });
    fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracingFilter: newFilter }),
    });
  }, [updateFilterUrl]);

  const toggleTracingKey = useCallback((key: string) => {
    const next = tracingFilter.includes(key)
      ? tracingFilter.filter((k) => k !== key)
      : [...tracingFilter, key];
    setTracingFilter(next);
    updateFilterUrl({ tracingFilter: next });
    fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracingFilter: next }),
    });
  }, [tracingFilter, updateFilterUrl]);

  // Actualizar prioridad mínima — actualiza estado + URL + guarda en DB
  const updateMinPriority = useCallback((priority: string | null) => {
    setMinPriority(priority);
    updateFilterUrl({ minPriority: priority });
    fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minPriority: priority }),
    });
  }, [updateFilterUrl]);

  // Actualizar mine — actualiza URL + guarda en DB
  const updateMine = useCallback((value: boolean) => {
    updateFilterUrl({ mine: value });
    fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToMeOnly: value }),
    });
  }, [updateFilterUrl]);

  // Actualizar favoritesOnly — actualiza URL + guarda en DB
  const updateFavoritesOnly = useCallback((value: boolean) => {
    updateFilterUrl({ favoritesOnly: value });
    fetch("/api/users/me/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favoritesOnly: value }),
    });
  }, [updateFilterUrl]);

  // Limpiar búsqueda fijada
  const clearPinnedSearch = useCallback(() => {
    setPinnedQuery("");
    setCommandQuery("");
    setCommandResults([]);
    setHighlightedRecord(null);
  }, []);

  // Destacar record si no está en la lista
  const ensureRecordInList = useCallback(
    (record: Record) => {
      const existsInFiltered = recordExists(filteredRecords, record.id);
      setHighlightedRecord(existsInFiltered ? null : record);
    },
    [filteredRecords]
  );

  // Refrescar records desde el servidor (respeta filtros actuales)
  const refreshRecords = useCallback(async () => {
    try {
      const { tracingFilter: tf, minPriority: mp, mine: m, favoritesOnly: fav } = filtersRef.current;
      const {
        records: freshRecords,
        lastId: newLastId,
        hasMore: newHasMore,
      } = await getRecords({
        take: Math.max(records.length, 20),
        explicitFilters: { tracingFilter: tf, minPriority: mp, mine: m, favoritesOnly: fav },
        priorityPreload,
      });
      setRecords(parseRecordsDates(freshRecords));
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
      // Agregar el record a la lista si no está — aparece naturalmente en filteredRecords
      setRecords((prev) =>
        recordExists(prev, record.id) ? prev : [record, ...prev]
      );
      if (commandQuery.trim()) {
        setPinnedQuery(commandQuery);
      }
      setCommandOpen(false);
      router.push(`/records/${record.id}`);
    },
    [commandQuery, router]
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
      setCommandResults((prev) => mergeUniqueRecords(prev, parseRecordsDates(found)));
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

  // Polling para sincronizar cambios (solo cuando la ventana está visible)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      // Polling cada 60 segundos (antes era 30)
      interval = setInterval(() => {
        if (!loading && document.visibilityState === "visible") {
          refreshRecords();
        }
      }, 60000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Refrescar al volver a la pestaña
        refreshRecords();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loading, refreshRecords]);

  // Reset cursor cuando cambia el filtro activo
  useEffect(() => {
    setCursor(null);
    setMore(true);
  }, [pinnedQuery]);

  // Infinite scroll
  useEffect(() => {
    const viewport =
      scrollRef.current?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]") ??
      scrollRef.current;
    if (!viewport || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && more && !loading) {
          setLoading(true);
          const { tracingFilter: tf, minPriority: mp, mine: m, favoritesOnly: fav } = filtersRef.current;
          const {
            records: newRecords,
            lastId: newCursor,
            hasMore,
          } = await getRecords({
            cursor: cursor ?? undefined,
            take: 10,
            query: pinnedQuery || undefined,
            explicitFilters: { tracingFilter: tf, minPriority: mp, mine: m, favoritesOnly: fav },
          });

          setRecords((prev) => mergeUniqueRecords(prev, parseRecordsDates(newRecords)));
          setCursor(newCursor);
          setMore(hasMore);
          setLoading(false);
        }
      },
      { root: viewport, rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [cursor, loading, more, pinnedQuery]);

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

  // Ref para el input de búsqueda inline
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Búsqueda inline: limpia resultados stale y dispara búsqueda server
  const setSearch = useCallback((query: string) => {
    setPinnedQuery(query);
    setCommandResults([]); // evita que resultados de búsqueda anterior contaminen la vista
    setCommandQuery(query);
  }, []);

  // Resultados visibles:
  // - Sin query: lista normal (filteredRecords)
  // - Con query + server respondió: solo resultados del server filtrados client-side (precisos, iguales en ambos layouts)
  // - Con query + server cargando: fallback a filtro local mientras llega la respuesta
  const displayRecords = useMemo(() => {
    if (!pinnedQuery.trim()) return filteredRecords;
    if (commandResults.length > 0) return filterRecords(commandResults, pinnedQuery, exactMatch);
    return filteredRecords;
  }, [pinnedQuery, filteredRecords, commandResults, exactMatch]);

  // Keyboard shortcut Cmd/Ctrl+K: hace focus al input inline
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Navegación por teclado en la lista (deshabilitada cuando hay un input con foco)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || !filteredRecords.length) return;

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
        shouldScrollCommandRef.current = true; // Activar scroll
        setCommandSelectedIndex((prev) =>
          Math.min(prev + 1, commandResults.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        shouldScrollCommandRef.current = true; // Activar scroll
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

  // Scroll al item seleccionado en el Command (solo si fue navegación por teclado)
  useEffect(() => {
    if (
      commandOpen &&
      shouldScrollCommandRef.current &&
      commandItemsRef.current[commandSelectedIndex]
    ) {
      commandItemsRef.current[commandSelectedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      shouldScrollCommandRef.current = false; // Resetear flag
    }
  }, [commandSelectedIndex, commandOpen]);

  // Debounce del query de búsqueda (300ms)
  const debouncedCommandQuery = useDebounce(commandQuery, 300);

  // Resetear índice del Command solo cuando cambia la búsqueda (no al cargar más)
  useEffect(() => {
    setCommandSelectedIndex(0);
  }, [debouncedCommandQuery]);

  // Búsqueda en el Command (con debounce)
  useEffect(() => {
    let active = true;

    const fetchResults = async () => {
      const query = debouncedCommandQuery?.trim();
      
      // Sin query, mostrar recientes desde la lista local (sin llamada al servidor)
      if (!query) {
        setCommandResults(recentRecords);
        setCommandLoading(false);
        setCommandCursor(null);
        setCommandHasMore(false);
        return;
      }

      // Primero intentar filtrar localmente
      const localResults = filterRecords(records, query, exactMatch);
      if (localResults.length > 0) {
        setCommandResults(localResults);
      }

      // Luego buscar en servidor si hay query
      setCommandLoading(true);
      try {
        const { records: found, lastId, hasMore } = await getRecords({
          query,
          take: 50, // Reducido de 100 a 50
          exactMatch,
        });

        if (active) {
          // Combinar resultados locales con los del servidor
          const serverResults = parseRecordsDates(found);
          const combined = serverResults.length > 0 
            ? serverResults 
            : localResults;
          
          setCommandResults(combined);
          setCommandCursor(lastId);
          setCommandHasMore(hasMore);
        }
      } catch {
        // En caso de error, usar resultados locales
        if (active) {
          setCommandResults(localResults.length > 0 ? localResults : filterRecords(recentRecords, query));
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
  }, [debouncedCommandQuery, exactMatch, recentRecords, records]);

  // Scroll al record destacado cuando viene del Command (solo una vez por highlight)
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId || !scrollRef.current) return;
    
    // Si ya hicimos scroll a este highlight, no hacerlo de nuevo
    if (lastScrolledHighlightRef.current === highlightId) return;

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
        lastScrolledHighlightRef.current = highlightId;
        return;
      }

      const index = filteredRecords.findIndex((r) => r.id === highlightNumId);
      if (index >= 0 && itemsRef.current[index]) {
        itemsRef.current[index].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setSelectedIndex(index);
        lastScrolledHighlightRef.current = highlightId;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [searchParams, filteredRecords, highlightedRecord]);

  // Limpiar el highlight trackeado cuando cambia la URL (sin highlight)
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (!highlightId) {
      lastScrolledHighlightRef.current = null;
    }
  }, [searchParams]);

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
    tracingFilter,
    minPriority,
    mine,
    favoritesOnly,
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
    searchInputRef,
    setSearch,
    displayRecords,
    setCommandQuery,
    setCommandSelectedIndex,
    setHighlightedRecord,
    handleItemClick,
    handleCommandSelect,
    handleCommandClose,
    loadMoreCommandResults,
    clearPinnedSearch,
    ensureRecordInList,
    updateTracingFilter,
    toggleTracingKey,
    updateMinPriority,
    updateMine,
    updateFavoritesOnly,
    // Router
    router,
    pathname,
  };
}

