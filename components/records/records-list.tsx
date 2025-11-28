"use client";

import { Record } from "@/app/generated/prisma/client";
import { PRIORITY_OPTIONS } from "@/app/constants";
import { useRecordsList } from "@/hooks/use-records-list";
import { CommandSearch } from "./command-search";
import { HighlightedRecordCard } from "./highlighted-record-card";
import { TracingBadge } from "./tracing-badge";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton que simula un item de la lista
function RecordItemSkeleton() {
  return (
    <div className="px-2 py-1.5 border-l-[3px] border-muted-foreground/20 animate-pulse">
      <div className="flex items-center justify-between gap-2 mb-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

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
      const {
    // State
    filteredRecords,
    selectedIndex,
    loading,
    more,
    pinnedQuery,
    highlightedRecord,
    records,
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
    // Router
    router,
    pathname,
  } = useRecordsList({ initialRecords, lastId, hasMore });

  return (
    <div className="w-full">
      {/* Buscador */}
      <CommandSearch
          open={commandOpen}
        query={commandQuery}
        loading={commandLoading}
        results={commandResults}
        hasMore={commandHasMore}
        selectedIndex={commandSelectedIndex}
        pinnedQuery={pinnedQuery}
        filteredCount={filteredRecords.length}
        itemsRef={commandItemsRef}
        onOpenChange={handleCommandClose}
        onQueryChange={setCommandQuery}
        onSelect={handleCommandSelect}
        onSelectedIndexChange={setCommandSelectedIndex}
        onLoadMore={loadMoreCommandResults}
        onClearPinned={clearPinnedSearch}
      />

      {/* Lista de records */}
      <ScrollArea className="h-[calc(100vh-230px)]" ref={scrollRef}>
        {/* Record destacado */}
        {highlightedRecord && (
          <HighlightedRecordCard
            ref={highlightedRef}
            record={highlightedRecord}
            onClose={() => setHighlightedRecord(null)}
            onClick={() => {
              const targetPath = `/records/${highlightedRecord.id}`;
              router.push(pathname === targetPath ? "/" : targetPath);
            }}
            showSeparator={filteredRecords.length > 0}
          />
        )}

        {/* Lista principal */}
        <SidebarMenu>
          {filteredRecords.length === 0 && !loading && !highlightedRecord ? (
            <div className="py-6 text-center">
              <p className="text-xs text-muted-foreground">
                {pinnedQuery ? "Sin resultados" : "No hay expedientes"}
              </p>
            </div>
          ) : (
            filteredRecords
              .filter(
                (r) =>
                  !highlightedRecord ||
                  Number(r.id) !== Number(highlightedRecord.id)
              )
              .map((record) => {
                const actualIndex = filteredRecords.findIndex(
                  (r) => r.id === record.id
                );
                const isSelected = selectedIndex === actualIndex;

            return (
              <SidebarMenuItem
                    key={record.id}
                ref={(el) => {
                      if (el) itemsRef.current[actualIndex] = el;
                    }}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-accent/80"
                        : "hover:bg-accent/40"
                }`}
                style={{
                  borderLeft: `3px solid ${
                        PRIORITY_OPTIONS[record.priority].color
                  }`,
                }}
              >
                <SidebarMenuButton asChild className="h-auto max-h-full">
                  <a
                        className="flex flex-col items-start justify-start py-1"
                        onClick={() => handleItemClick(actualIndex)}
                      >
                        <span className="flex items-center justify-between gap-1.5 w-full">
                          <p className="text-sm font-medium">{record.order}</p>
                          <TracingBadge tracing={record.tracing} />
                        </span>
                        <span className="text-xs text-muted-foreground uppercase truncate w-full">
                          {record.name}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
              })
          )}
        </SidebarMenu>

        {/* Sentinel para infinite scroll */}
        {more && <div ref={sentinelRef} className="h-4" />}

        {/* Loading indicator */}
        {loading && (
          <div className="space-y-1 px-1">
            <RecordItemSkeleton />
            <RecordItemSkeleton />
          </div>
        )}

        {/* Indicador de carga inline más sutil */}
        {more && !loading && (
          <div className="py-2 text-center">
            <span className="text-[10px] text-muted-foreground/50">
              Desplaza para cargar más
            </span>
          </div>
        )}

        {/* End of list message */}
        {!more && records.length > 0 && (
          <div className="py-3 text-center">
            <span className="text-[10px] text-muted-foreground/50">
              — {records.length} expedientes —
            </span>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
