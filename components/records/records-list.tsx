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
          {filteredRecords
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
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-gray-200 dark:bg-gray-700 font-semibold"
                      : ""
                  }`}
                  style={{
                    borderLeft: `3px solid ${
                      PRIORITY_OPTIONS[record.priority].color
                    }`,
                  }}
                >
                  <SidebarMenuButton asChild className="h-auto max-h-full">
                    <a
                      className="flex flex-col items-start justify-start"
                      onClick={() => handleItemClick(actualIndex)}
                    >
                      <span className="flex items-center justify-between gap-1.5">
                        <p>{record.order}</p>
                        <TracingBadge tracing={record.tracing} />
                      </span>
                      <span className="uppercase">{record.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
        </SidebarMenu>

        {/* Sentinel para infinite scroll */}
        {more && <div ref={sentinelRef} className="h-6" />}

        {/* Loading indicator */}
        {loading && <Skeleton className="w-full h-14 mt-1.5 animate-pulse" />}

        {/* End of list message */}
        {!more && records.length > 0 && (
          <div className="py-2 text-center text-sm text-muted-foreground">
            No hay más expedientes
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
