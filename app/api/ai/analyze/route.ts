import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { downloadFile } from "@/lib/storage";
import { extractText } from "@/lib/ai-matcher";
import { TRACING_OPTIONS } from "@/app/constants/tracing";
import { PRIORITY_OPTIONS } from "@/app/constants/priority";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Sos un asistente legal especializado en gestión de expedientes judiciales para un estudio de abogados argentino (peritos contadores).

Tu rol es analizar el estado de un expediente y sus archivos adjuntos para brindar un análisis claro y accionable.

Respondé siempre en español argentino, de forma concisa. Sin saludos ni presentaciones — ir directo al análisis.

Estructura tu respuesta así:
**Resumen** — qué es el caso y en qué etapa está
**Observaciones** — puntos importantes, riesgos, inconsistencias o inactividad notable
**Sugerencias** — cambios concretos recomendados (prioridad, estado, próximas acciones)

ESTADOS DISPONIBLES: ${Object.entries(TRACING_OPTIONS).map(([k, v]) => `${k} (${v.label})`).join(", ")}
PRIORIDADES (mayor a menor): URGENTE, ALTA, MEDIA, BAJA, NULA, INACTIVO`;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { recordId } = await req.json();
  if (!recordId) return new Response("Missing recordId", { status: 400 });

  const record = await prisma.record.findUnique({
    where: { id: recordId },
    include: {
      files: { orderBy: { createdAt: "desc" }, take: 10 },
      RecordsAndUser: { include: { User: { select: { name: true } } } },
      Note: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!record) return new Response("Not found", { status: 404 });

  // Build record context
  const priority = PRIORITY_OPTIONS[record.priority];
  const tracing = TRACING_OPTIONS[record.tracing];
  const daysSinceUpdate = Math.floor((Date.now() - new Date(record.updatedAt).getTime()) / 86400000);
  const assignees = (record as any).RecordsAndUser?.map((r: any) => r.User?.name || "Sin nombre").join(", ") ?? "";

  let context = `EXPEDIENTE: ${record.order}
Carátula: ${record.name}
Estado actual: ${tracing?.label ?? record.tracing}
Prioridad actual: ${priority?.label ?? record.priority}
Última actividad: hace ${daysSinceUpdate} días
Asignados: ${assignees || "Ninguno"}`;

  if (record.defendant.length) context += `\nDemandados: ${record.defendant.join(", ")}`;
  if (record.prosecutor.length) context += `\nActores/Peritos: ${record.prosecutor.join(", ")}`;
  if (record.insurance.length) context += `\nAseguradoras: ${record.insurance.join(", ")}`;

  const notes = (record as any).Note as Array<{ text: string }> | undefined;
  if (notes?.length) {
    context += `\n\nÚLTIMAS NOTAS:\n${notes.map((n) => `- ${n.text}`).join("\n")}`;
  }

  // Extract text from files (up to 5 files, 1500 chars each)
  const fileTexts: string[] = [];
  const files = (record as any).files as Array<{ storagePath: string; type: string; name: string }>;
  for (const file of files.slice(0, 5)) {
    try {
      const storagePath = file.storagePath;
      // Extract Google Drive file ID from storagePath or url
      const fileId = storagePath?.split("/").pop() ?? storagePath;
      if (!fileId) continue;

      const buffer = await downloadFile(fileId);
      const text = await extractText(buffer, file.type, file.name);
      if (text.trim()) {
        fileTexts.push(`[${file.name}]\n${text.slice(0, 1500)}`);
      }
    } catch {
      // Skip files that can't be read
    }
  }

  if (fileTexts.length) {
    context += `\n\nARCHIVOS ADJUNTOS (${fileTexts.length}):\n${fileTexts.join("\n\n---\n\n")}`;
  } else {
    context += `\n\nArchivos adjuntos: ${files.length} (sin texto extraíble)`;
  }

  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: context }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
    cancel() {
      stream.controller.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
