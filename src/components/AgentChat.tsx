"use client";

import { useState, useRef, useEffect } from "react";

const TIERS = [
  { value: "balanced", label: "Balanced", hint: "Sonnet → gpt-4o-mini" },
  { value: "premium", label: "Premium", hint: "Sonnet → gpt-4o" },
  { value: "fast", label: "Fast", hint: "gpt-4o-mini → Haiku" },
  { value: "free", label: "Free", hint: "Sonnet → free Llama / Gemma" },
] as const;

type Tier = (typeof TIERS)[number]["value"];

interface Msg {
  role: "user" | "assistant";
  content: string;
  meta?: { model?: string; retrieved?: number; rag_note?: string | null };
}

const STARTERS = [
  "What does Marcus mean by 'the dichotomy of control'?",
  "I'm angry at a colleague — what would Seneca say?",
  "Give me a morning intention.",
  "Premeditatio for a difficult conversation tomorrow.",
];

export default function AgentChat() {
  const [tier, setTier] = useState<Tier>("balanced");
  const [rag, setRag] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    setError(null);
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, tier, rag }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content: j.content ?? "(empty response)",
          meta: { model: j.model, retrieved: j.retrieved, rag_note: j.rag_note },
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t || busy) return;
    send(t);
  }

  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-[var(--rule)] text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[var(--ink)]">Agent</span>
          <span className="text-[var(--ink-soft)]">Stoic mentor · cites passages</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={rag}
              onChange={(e) => setRag(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span>RAG</span>
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as Tier)}
            className="border border-[var(--rule)] rounded px-1.5 py-0.5 bg-[var(--background)]"
            aria-label="Model tier"
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 py-3 max-h-[60vh] min-h-[40vh] overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-sm text-[var(--ink-soft)]">
            <p className="mb-2">Try one of these:</p>
            <ul className="flex flex-col gap-1">
              {STARTERS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => send(s)}
                    className="text-left text-[var(--accent)] hover:text-[var(--accent-strong)] underline-offset-2 hover:underline"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "self-end max-w-[85%] rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)] px-3 py-2 text-sm whitespace-pre-wrap"
                : "self-start max-w-[90%] rounded-md bg-[var(--paper)] text-[var(--ink)] px-3 py-2 text-sm whitespace-pre-wrap"
            }
          >
            {m.content}
            {m.meta && (
              <div className="mt-1 text-[10px] font-mono text-[var(--ink-soft)]">
                {m.meta.model}
                {typeof m.meta.retrieved === "number" ? ` · ${m.meta.retrieved} retrieved` : ""}
                {m.meta.rag_note ? ` · ${m.meta.rag_note}` : ""}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="self-start text-sm text-[var(--ink-soft)] italic">
            …
          </div>
        )}
        {error && (
          <div className="self-stretch text-sm rounded bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 px-3 py-2">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="border-t border-[var(--rule)] flex gap-2 px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the Stoic mentor…"
          aria-label="Message"
          className="flex-1 bg-transparent text-sm outline-none px-2 py-1.5"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded bg-[var(--accent)] text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
