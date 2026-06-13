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

const TASKS: { label: string; prompt: string; hint: string }[] = [
  {
    label: "Morning intention",
    prompt:
      "Give me a morning intention in the Epictetan style. Three bullets: what is in my control today, what could go wrong, how I will respond Stoically. Be specific, not abstract.",
    hint: "Premeditatio + dichotomy of control",
  },
  {
    label: "Evening review",
    prompt:
      "Walk me through a Senecan evening review. Ask me three questions in sequence (one at a time): what did I do well today, where did I fail, how will I do better tomorrow. Wait for my answer before asking the next.",
    hint: "Sextius / Seneca — Letters 83",
  },
  {
    label: "Premeditatio",
    prompt:
      "I have a difficult situation coming up. Help me rehearse it as a premeditatio malorum. Ask me what the situation is, then walk me through: (1) the worst plausible outcome, (2) the most likely outcome, (3) my virtue-preserving response in each case.",
    hint: "Rehearse the worst",
  },
  {
    label: "7-day plan",
    prompt:
      "Design me a 7-day Stoic discipline plan. One practice per day, building in difficulty. Each day cites a relevant passage (Meditations / Letters / Enchiridion / Discourses) and gives a 2-sentence \"why\" plus a concrete action.",
    hint: "Progressive askesis",
  },
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

      {/* Tasks bar — PBI-3.5 */}
      <div className="px-3 py-2 border-b border-[var(--rule)] flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-[var(--ink-soft)] uppercase tracking-wider mr-1">tasks</span>
        {TASKS.map((t) => (
          <button
            key={t.label}
            type="button"
            disabled={busy}
            onClick={() => send(t.prompt)}
            title={t.hint}
            className="rounded border border-[var(--rule)] px-2 py-1 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            {t.label}
          </button>
        ))}
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
