"use client";

import { CornerUpLeft, FileText, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "./chat-types";
import Link from "next/link";

const TRACING_LABELS: Record<string, string> = {
  ACEPTA_CARGO: "Acepta cargo",
  ACTO_PERICIAL_REALIZADO: "Acto pericial",
  PERICIA_REALIZADA: "Pericia realizada",
  SENTENCIA_O_CONVENIO_DE_PARTES: "Sentencia",
  HONORARIOS_REGULADOS: "Honorarios",
  EN_TRATATIVA_DE_COBRO: "En cobro",
  COBRADO: "Cobrado",
};

function highlightMentions(text: string, isMe: boolean) {
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className={cn("font-medium", isMe ? "text-primary-foreground/70 underline underline-offset-2" : "text-primary")}>
        {part}
      </span>
    ) : (
      part
    )
  );
}

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onReply: (message: Message) => void;
}

export function MessageBubble({ message, isMe, onReply }: MessageBubbleProps) {
  return (
    <div className={cn("flex gap-2 group", isMe ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
        {message.sender.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.sender.image} alt="" className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="text-[9px] font-bold text-muted-foreground">
            {(message.sender.name ?? message.sender.email)[0].toUpperCase()}
          </span>
        )}
      </div>

      <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
        {/* Sender name */}
        {!isMe && (
          <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">
            {message.sender.name ?? message.sender.email}
          </span>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={cn(
            "text-[11px] px-2 py-1 rounded-lg mb-0.5 border-l-2 border-primary/50 bg-muted/50 max-w-full",
            isMe ? "mr-1" : "ml-1"
          )}>
            <span className="font-medium text-primary/70">{message.replyTo.sender.name ?? "Usuario"}: </span>
            <span className="text-muted-foreground truncate">{message.replyTo.text.slice(0, 80)}{message.replyTo.text.length > 80 ? "…" : ""}</span>
          </div>
        )}

        {/* Record attachment */}
        {message.record && (
          <Link
            href={`/records/${message.record.id}`}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl mb-1 border bg-primary/5 hover:bg-primary/10 transition-colors max-w-full",
              isMe ? "rounded-br-sm" : "rounded-bl-sm"
            )}
          >
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{message.record.name}</p>
              <p className="text-[10px] text-muted-foreground">{message.record.order} · {TRACING_LABELS[message.record.tracing] ?? message.record.tracing}</p>
            </div>
            <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
          </Link>
        )}

        {/* File attachment */}
        {message.file && (
          <a
            href={message.file.url}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl mb-1 border bg-muted hover:bg-muted/80 transition-colors max-w-full",
              isMe ? "rounded-br-sm" : "rounded-bl-sm"
            )}
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs truncate">{message.file.name}</p>
          </a>
        )}

        {/* Bubble */}
        <div className={cn(
          "relative px-3 py-2 rounded-2xl text-sm leading-snug",
          isMe
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}>
          <p className="whitespace-pre-wrap break-words">{highlightMentions(message.text, isMe)}</p>
        </div>

        {/* Time + reply action */}
        <div className={cn("flex items-center gap-1.5 mt-0.5", isMe ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[9px] text-muted-foreground/50">
            {new Date(message.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={() => onReply(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-muted-foreground"
            title="Responder"
          >
            <CornerUpLeft className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
