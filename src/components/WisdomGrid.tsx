"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  WISDOM, ALL_THEMES, ALL_AUTHORS, ALL_VIRTUES, ALL_CONTEXTS,
  type Wisdom, type Virtue, type Context,
} from "@/lib/wisdom-data";
import { getStoic } from "@/lib/stoics-data";

type Sort = "quality" | "random";

function shuffleSeed(date = new Date()): number {
  return date.getUTCFullYear() * 1000 + date.getUTCMonth() * 50 + date.getUTCDate();
}

function copyText(text: string, ref: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(`"${text}"\n— ${ref}`);
  }
}

export default function WisdomGrid({ initialTheme }: { initialTheme?: string }) {
  const [themes, setThemes] = useState<string[]>(initialTheme ? [initialTheme] : []);
  const [virtue, setVirtue] = useState<Virtue | null>(null);
  const [author, setAuthor] = useState<string | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [sort, setSort] = useState<Sort>("quality");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let out: Wisdom[] = WISDOM.filter((w) => {
      if (themes.length && !themes.some((t) => w.themes.includes(t))) return false;
      if (virtue && w.virtue !== virtue) return false;
      if (author && w.author_slug !== author) return false;
      if (context && !w.use_contexts.includes(context)) return false;
      return true;
    });
    if (sort === "quality") {
      out = out.slice().sort((a, b) => b.quality_score - a.quality_score);
    } else {
      const seed = shuffleSeed();
      out = out
        .map((w) => ({ w, r: ((seed * w.text.charCodeAt(0)) % 997) }))
        .sort((a, b) => a.r - b.r)
        .map((x) => x.w);
    }
    return out;
  }, [themes, virtue, author, context, sort]);

  function toggleTheme(t: string) {
    setThemes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  function clearAll() {
    setThemes([]);
    setVirtue(null);
    setAuthor(null);
    setContext(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--ink)]">{filtered.length} of {WISDOM.length} passages</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1">
              <span className="text-[var(--ink-soft)]">sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="border border-[var(--rule)] rounded px-1.5 py-0.5 bg-[var(--background)]"
              >
                <option value="quality">quality</option>
                <option value="random">random</option>
              </select>
            </label>
            {(themes.length || virtue || author || context) && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[var(--accent)] hover:underline"
              >
                clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] self-center mr-1">theme</span>
          {ALL_THEMES.map((t) => {
            const on = themes.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTheme(t)}
                className={
                  "text-xs rounded px-2 py-0.5 border " +
                  (on
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-transparent text-[var(--ink-soft)] border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)]")
                }
              >
                #{t}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] self-center mr-1">virtue</span>
          {ALL_VIRTUES.map((v) => {
            const on = virtue === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVirtue(on ? null : v)}
                className={
                  "text-xs rounded px-2 py-0.5 border " +
                  (on
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-transparent text-[var(--ink-soft)] border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)]")
                }
              >
                {v}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] self-center mr-1">author</span>
          {ALL_AUTHORS.map((a) => {
            const on = author === a;
            const st = getStoic(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAuthor(on ? null : a)}
                className={
                  "text-xs rounded px-2 py-0.5 border " +
                  (on
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-transparent text-[var(--ink-soft)] border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)]")
                }
              >
                {st?.name ?? a}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] self-center mr-1">context</span>
          {ALL_CONTEXTS.map((c) => {
            const on = context === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setContext(on ? null : c)}
                className={
                  "text-xs rounded px-2 py-0.5 border " +
                  (on
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "bg-transparent text-[var(--ink-soft)] border-[var(--rule)] hover:border-[var(--accent)] hover:text-[var(--accent)]")
                }
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card grid */}
      {filtered.length === 0 && (
        <div className="text-sm text-[var(--ink-soft)] rounded border border-dashed border-[var(--rule)] p-6 text-center">
          No matches. Loosen the filter.
        </div>
      )}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((w) => {
          const st = getStoic(w.author_slug);
          return (
            <li
              key={w.id}
              className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-4 flex flex-col gap-3"
            >
              <blockquote className="text-[var(--ink)] leading-relaxed">
                &ldquo;{w.text}&rdquo;
              </blockquote>
              <div className="flex items-baseline justify-between text-xs">
                <Link href={`/stoics/${w.author_slug}` as never} className="text-[var(--accent)] hover:underline">
                  — {st?.name ?? w.author_slug}
                </Link>
                <span className="font-mono text-[var(--ink-soft)]">{w.source_ref}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <div className="flex flex-wrap gap-1">
                  {w.themes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTheme(t)}
                      className="rounded bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--accent)] px-1.5 py-0.5"
                    >
                      #{t}
                    </button>
                  ))}
                  {w.virtue && (
                    <span className="rounded bg-[var(--accent-soft)] text-[var(--accent-strong)] px-1.5 py-0.5">
                      {w.virtue}
                    </span>
                  )}
                  <span className="rounded bg-transparent text-[var(--ink-soft)] px-1.5 py-0.5 font-mono">
                    q={w.quality_score}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    copyText(w.text, w.source_ref);
                    setCopiedId(w.id);
                    setTimeout(() => setCopiedId((c) => (c === w.id ? null : c)), 1500);
                  }}
                  className="text-[var(--accent)] hover:underline"
                >
                  {copiedId === w.id ? "copied!" : "copy"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
