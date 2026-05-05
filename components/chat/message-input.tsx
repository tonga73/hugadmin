"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, FileText, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, ChatUser, AttachedRecord } from "./chat-types";

interface MessageInputProps {
  replyTo: Message | null;
  onClearReply: () => void;
  onSend: (text: string, replyToId?: number, recordId?: number) => Promise<void>;
  members: ChatUser[];
  meId: number;
}

export function MessageInput({ replyTo, onClearReply, onSend, members, meId }: MessageInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [attachedRecord, setAttachedRecord] = useState<AttachedRecord | null>(null);
  const [showRecordSearch, setShowRecordSearch] = useState(false);
  const [recordSearch, setRecordSearch] = useState("");
  const [recordResults, setRecordResults] = useState<AttachedRecord[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const otherMembers = members.filter((m) => m.id !== meId);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text]);

  // Focus when reply changes
  useEffect(() => {
    if (replyTo) textareaRef.current?.focus();
  }, [replyTo]);

  // Search records as user types
  useEffect(() => {
    if (!showRecordSearch || !recordSearch.trim()) { setRecordResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/records?search=${encodeURIComponent(recordSearch)}`).then((r) => r.json()).catch(() => []);
      setRecordResults(Array.isArray(res.records) ? res.records.slice(0, 6) : []);
    }, 300);
    return () => clearTimeout(t);
  }, [recordSearch, showRecordSearch]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    // Detect @mention
    const match = val.slice(0, e.target.selectionStart ?? val.length).match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const insertMention = (user: ChatUser) => {
    const mention = `@${user.name?.replace(/\s+/g, "_") ?? user.email.split("@")[0]}`;
    setText((prev) => prev.replace(/@\w*$/, mention + " "));
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    if (!text.trim() && !attachedRecord) return;
    setSending(true);
    try {
      await onSend(text.trim() || "📎", replyTo?.id, attachedRecord?.id);
      setText("");
      setAttachedRecord(null);
      onClearReply();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      onClearReply();
      setMentionQuery(null);
    }
  };

  const mentionSuggestions = mentionQuery !== null
    ? otherMembers.filter((m) =>
        (m.name ?? m.email).toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  return (
    <div className="border-t px-3 py-2 space-y-1.5">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/60 border-l-2 border-primary/50">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-medium text-primary/70">{replyTo.sender.name ?? replyTo.sender.email}</span>
            <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <button onClick={onClearReply} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attached record */}
      {attachedRecord && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium flex-1 truncate">{attachedRecord.name}</span>
          <button onClick={() => setAttachedRecord(null)} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* @mention suggestions */}
      {mentionSuggestions.length > 0 && (
        <div className="rounded-lg border bg-popover shadow-md overflow-hidden">
          {mentionSuggestions.map((user) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-sm"
            >
              <AtSign className="h-3 w-3 text-primary" />
              {user.name ?? user.email}
            </button>
          ))}
        </div>
      )}

      {/* Record search dropdown */}
      {showRecordSearch && (
        <div className="rounded-lg border bg-popover shadow-md overflow-hidden space-y-1 p-2">
          <input
            autoFocus
            value={recordSearch}
            onChange={(e) => setRecordSearch(e.target.value)}
            placeholder="Buscar expediente..."
            className="w-full text-xs px-2 py-1.5 rounded border bg-background outline-none focus:ring-1 focus:ring-primary"
          />
          {recordResults.map((r) => (
            <button
              key={r.id}
              onClick={() => { setAttachedRecord(r); setShowRecordSearch(false); setRecordSearch(""); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-xs"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-muted-foreground">{r.order}</p>
              </div>
            </button>
          ))}
          <button onClick={() => setShowRecordSearch(false)} className="text-[10px] text-muted-foreground hover:text-foreground w-full text-center pt-1">
            Cancelar
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowRecordSearch((v) => !v)}
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
            showRecordSearch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
          )}
          title="Compartir expediente"
        >
          <FileText className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje... (@nombre para mencionar)"
          rows={1}
          className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary leading-snug"
          style={{ minHeight: "36px", maxHeight: "120px" }}
        />

        <button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !attachedRecord)}
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
            sending || (!text.trim() && !attachedRecord)
              ? "text-muted-foreground/30"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
