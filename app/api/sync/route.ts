// app/api/sync/route.ts — Trigger Drive sync with SSE progress
import { syncDrive } from "@/lib/drive-sync";

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await syncDrive((progress) => send(progress));
        send({ type: "done", ...result });
      } catch (err) {
        const error = err as any;
        console.error("Sync error:", error?.message, error?.code, error?.status);
        send({ type: "error", error: error?.message ?? "Error desconocido" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
