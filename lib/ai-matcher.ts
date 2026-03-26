// lib/ai-matcher.ts — Text extraction + Claude AI matching
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Text extraction ──────────────────────────────────────────────────────────

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    filename.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType.startsWith("image/")) {
    // Use Claude vision to describe the image
    const base64 = buffer.toString("base64");
    const mediaType = mimeType as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "Transcribe todo el texto visible en esta imagen, especialmente números de expediente, nombres de partes, y cualquier referencia legal. Responde solo con el texto transcripto.",
            },
          ],
        },
      ],
    });

    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  // For unsupported types, return empty string
  return "";
}

// ─── AI Matching ─────────────────────────────────────────────────────────────

export interface RecordCandidate {
  id: number;
  order: string;
  name: string;
  code?: string | null;
}

export interface MatchResult {
  recordId: number | null;
  confidence: number; // 0-1
  reasoning: string;
}

export async function matchFileToRecord(
  extractedText: string,
  candidates: RecordCandidate[]
): Promise<MatchResult> {
  if (!extractedText.trim() || candidates.length === 0) {
    return { recordId: null, confidence: 0, reasoning: "Sin texto o candidatos" };
  }

  // Limit candidates list to avoid huge prompts
  const candidateList = candidates
    .slice(0, 200)
    .map(
      (r) =>
        `ID:${r.id} | Nro:${r.order} | Código:${r.code || "-"} | Nombre:${r.name}`
    )
    .join("\n");

  const prompt = `Eres un asistente legal argentino. Tu tarea es determinar a qué expediente judicial pertenece un documento.

TEXTO DEL DOCUMENTO (primeros 3000 chars):
${extractedText.slice(0, 3000)}

LISTA DE EXPEDIENTES DISPONIBLES:
${candidateList}

Analiza el texto y devuelve un JSON con este formato exacto (sin markdown, sin explicaciones):
{"recordId": <id numérico o null>, "confidence": <número 0.0 a 1.0>, "reasoning": "<explicación breve en español>"}

Si no hay ningún match razonable (confidence < 0.3), usa null para recordId.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    return { recordId: null, confidence: 0, reasoning: "Respuesta inválida de IA" };
  }

  try {
    const parsed = JSON.parse(block.text.trim()) as MatchResult;
    return {
      recordId: parsed.recordId ?? null,
      confidence: Math.min(1, Math.max(0, parsed.confidence)),
      reasoning: parsed.reasoning,
    };
  } catch {
    return { recordId: null, confidence: 0, reasoning: "No se pudo parsear respuesta" };
  }
}
