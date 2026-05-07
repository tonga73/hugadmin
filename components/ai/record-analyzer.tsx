"use client";

import { useState, useRef } from "react";
import { Sparkles, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface RecordAnalyzerProps {
  recordId: number;
  recordOrder: string;
}

export function RecordAnalyzer({ recordId, recordOrder }: RecordAnalyzerProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = async () => {
    setText("");
    setError(null);
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error desconocido");
      }
      if (!res.body) throw new Error("Sin respuesta del servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v && !text && !loading) analyze();
    if (!v) abortRef.current?.abort();
  };

  const retry = () => {
    abortRef.current?.abort();
    analyze();
  };

  // Simple markdown-ish bold rendering
  const renderText = (raw: string) => {
    return raw.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleOpen(true)}
        className="h-7 w-7 text-muted-foreground hover:text-violet-400 transition-colors"
        title="Analizar con IA"
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      <Sheet open={open} onOpenChange={handleOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 py-3 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <SheetTitle className="text-sm font-medium">Análisis IA — {recordOrder}</SheetTitle>
              </div>
              <div className="flex items-center gap-1">
                {!loading && text && (
                  <Button variant="ghost" size="icon" onClick={retry} className="h-6 w-6 text-muted-foreground" title="Volver a analizar">
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-6 w-6 text-muted-foreground">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loading && !text && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1 w-1 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1 w-1 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                <span className="ml-1">Analizando expediente...</span>
              </div>
            )}

            {error && (
              <div className="space-y-2">
                <p className="text-xs text-destructive leading-snug">{error}</p>
                <button onClick={retry} className="text-xs text-muted-foreground underline underline-offset-2">Reintentar</button>
              </div>
            )}

            {text && (
              <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {renderText(text)}
                {loading && (
                  <span className="inline-block w-1.5 h-3.5 bg-violet-400/60 ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
