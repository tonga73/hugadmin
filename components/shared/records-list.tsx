"use client";

import { useEffect, useRef, useState } from "react";
import { getRecords } from "@/app/actions/getRecords";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

// 🔹 Tipo de registro (puede venir de Prisma)
interface RecordItem {
  id: number;
  name: string;
}

// 🔹 Props del componente
interface RecordsListProps {
  initialRecords: RecordItem[];
  lastId: number | null;
  hasMore: boolean;
}

export function RecordsList({
  initialRecords,
  lastId,
  hasMore,
}: RecordsListProps) {
  const [records, setRecords] = useState<RecordItem[]>(initialRecords);
  const [cursor, setCursor] = useState<number | null>(lastId);
  const [loading, setLoading] = useState<boolean>(false);
  const [more, setMore] = useState<boolean>(hasMore);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

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

          setRecords((prev) => [...prev, ...newRecords]);
          setCursor(newCursor);
          setMore(hasMore);
          setLoading(false);
        }
      },
      {
        root: viewport,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [cursor, loading, more]);

  return (
    <ScrollArea className="h-[calc(100vh-150px)]" ref={scrollRef}>
      <SidebarMenu>
        {records.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <a href="#">
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      {/* 👇 Sentinel invisible que dispara el observer */}
      {more && <div ref={sentinelRef} className="h-6" />}

      {loading && (
        <div className="py-2 text-center text-sm text-muted-foreground">
          Cargando...
        </div>
      )}

      {!more && (
        <div className="py-2 text-center text-sm text-muted-foreground">
          No hay más expedientes
        </div>
      )}
    </ScrollArea>
  );
}
