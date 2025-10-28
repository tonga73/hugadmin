"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getRecords } from "@/app/actions/getRecords";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Record } from "@/app/generated/prisma/client";
import { Badge } from "../ui/badge";

// 🔹 Props
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

  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [cursor, setCursor] = useState<number | null>(lastId);
  const [loading, setLoading] = useState<boolean>(false);
  const [more, setMore] = useState<boolean>(hasMore);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLLIElement[]>([]);

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

          setRecords((prev) => [...prev, ...newRecords]);
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
    const currentIndex = records.findIndex(
      (r) => `/records/${r.id}` === pathname
    );
    setSelectedIndex(currentIndex); // si no encuentra, devuelve -1
  }, [pathname, records]);

  // 🔹 Manejo de teclado
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!records.length) return;

      if (e.key === "ArrowDown") {
        const nextIndex = Math.min(selectedIndex + 1, records.length - 1);
        router.push(`/records/${records[nextIndex].id}`);
      } else if (e.key === "ArrowUp") {
        const prevIndex = Math.max(selectedIndex - 1, 0);
        router.push(`/records/${records[prevIndex].id}`);
      } else if (e.key === "Enter") {
        router.push(`/records/${records[selectedIndex].id}`);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [records, selectedIndex, router]);

  // 🔹 Mantener el item seleccionado visible
  useEffect(() => {
    const el = itemsRef.current[selectedIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, records]);

  // 🔹 Click en item
  const handleClick = (index: number) => {
    const record = records[index];
    const targetPath = `/records/${record.id}`;

    if (pathname === targetPath) {
      router.push("/"); // si es el mismo, volvemos a /
    } else {
      router.push(targetPath);
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-150px)]" ref={scrollRef}>
      <SidebarMenu>
        {records.map((item, index) => {
          const isSelected = selectedIndex === index;

          return (
            <SidebarMenuItem
              key={item.id}
              ref={(el) => {
                if (el) itemsRef.current[index] = el;
              }}
              className={`transition-colors cursor-pointer ${
                isSelected ? "bg-gray-200 dark:bg-gray-700 font-semibold" : ""
              }`}
            >
              <SidebarMenuButton asChild className="h-auto max-h-full">
                <a
                  className="flex flex-col items-start justify-start"
                  onClick={() => handleClick(index)}
                >
                  <span className="flex items-center justify-between gap-1.5">
                    <p>{item.order}</p> <Badge>{item.priority}</Badge>
                  </span>
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>

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
