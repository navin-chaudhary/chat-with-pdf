"use client";

import { ChatMarkdown } from "@/components/ChatMarkdown";
import { useCallback, useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export function ChatWithPdf({ className = "" }: { className?: string }) {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastSources, setLastSources] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState("");
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, chatting]);

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    setMessages([]);
    setLastSources([]);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDocumentId(data.documentId);
      setFileName(data.fileName);
      setChunkCount(data.chunkCount);
    } catch (e) {
      setDocumentId(null);
      setFileName(null);
      setChunkCount(null);
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const sendQuestion = useCallback(async () => {
    const q = question.trim();
    if (!documentId || !q || chatting) return;
    setError(null);
    setChatting(true);
    setQuestion("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed");
      setLastSources(data.sourcePreviews ?? []);
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Something went wrong.",
        },
      ]);
    } finally {
      setChatting(false);
    }
  }, [documentId, question, chatting]);

  return (
    <div className={className}>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            How can I help with your document?
          </h1>
          <p className="text-sm text-zinc-400">
            Upload a PDF below and ask anything about its content.
          </p>
          {fileName && documentId && (
            <p className="text-xs text-zinc-500">
              Active file: <span className="text-zinc-300">{fileName}</span>
              {chunkCount != null ? ` - ${chunkCount} chunks indexed` : ""}
            </p>
          )}
        </div>

        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-xl shadow-black/25">
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4 sm:px-5">
            {messages.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-500">
                {documentId
                  ? "Ask your first question."
                  : "Start by uploading a PDF below."}
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[min(92%,34rem)] rounded-2xl rounded-br-md bg-linear-to-br from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm text-white shadow-md shadow-emerald-950/35">
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  <div className="max-w-[min(100%,38rem)] rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-zinc-100">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Assistant
                    </p>
                    <div className="text-zinc-200 [&_a]:text-emerald-400">
                      <ChatMarkdown content={msg.content} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {chatting && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-950/80 px-4 py-3">
                  <span className="flex gap-1" aria-hidden>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500/80 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500/80 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500/80" />
                  </span>
                  <span className="text-sm text-zinc-500">Generating answer...</span>
                </div>
              </div>
            )}
            <div ref={scrollAnchorRef} className="h-px w-full" aria-hidden />
          </div>

          <div className="border-t border-zinc-800 bg-zinc-950/85 p-3 sm:p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void sendQuestion()}
                placeholder={
                  documentId
                    ? "Ask a question about this document..."
                    : "Upload a PDF first"
                }
                disabled={!documentId || chatting}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-emerald-600/60 focus:ring-2 focus:ring-emerald-600/25"
              />
              <button
                type="button"
                onClick={() => void sendQuestion()}
                disabled={!documentId || chatting || !question.trim()}
                className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-950/30 transition hover:bg-emerald-500 disabled:pointer-events-none disabled:opacity-40"
              >
                Send
              </button>
            </div>

            <div className="mt-3">
              <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                disabled={uploading}
                className="w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:border-emerald-600/50 hover:bg-zinc-900 disabled:opacity-60"
              >
                {uploading ? "Indexing PDF..." : "Add document (PDF)"}
              </button>
            </div>
          </div>
        </div>

        {lastSources.length > 0 && (
          <details className="group rounded-xl border border-zinc-800 bg-zinc-900/40">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-300 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-800 text-xs text-zinc-400 transition group-open:rotate-90">
                ▸
              </span>
              Source excerpts ({lastSources.length})
            </summary>
            <div className="border-t border-zinc-800 px-4 py-3">
              <ol className="space-y-2.5">
                {lastSources.map((s, i) => (
                  <li key={i} className="flex gap-3 text-xs leading-relaxed text-zinc-500">
                    <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-950/80 font-mono text-[10px] font-semibold text-emerald-300">
                      {i + 1}
                    </span>
                    <span className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-2 font-mono">
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        )}

        {error && (
          <div role="alert" className="rounded-lg border border-red-800/60 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
