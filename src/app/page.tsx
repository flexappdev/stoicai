import Link from "next/link";

export default function AgentLanding() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">
          StoicAI Agent — v0.1 scaffold
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
          A Stoic mentor, grounded in 10,000 cited passages.
        </h1>
        <p className="mt-3 text-[var(--ink-soft)] max-w-2xl">
          Marcus Aurelius, Seneca, Epictetus, Musonius — chunked, themed, embedded, and
          retrievable. The agent cites every claim (<span className="font-mono">Meditations 4.7</span>)
          and never invents quotes. Chat panel + structured tasks (morning intention, evening review,
          premeditatio scripts, journaling prompts). Coming online phase by phase.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-[var(--accent-soft)] text-[var(--accent-strong)] px-2 py-1">
            Phase 0: shell + schema · live
          </span>
          <span className="rounded bg-[var(--paper)] text-[var(--ink-soft)] px-2 py-1">
            Phase 1: ingest 5K
          </span>
          <span className="rounded bg-[var(--paper)] text-[var(--ink-soft)] px-2 py-1">
            Phase 2: enrich + embed
          </span>
          <span className="rounded bg-[var(--paper)] text-[var(--ink-soft)] px-2 py-1">
            Phase 3: agent online
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <h2 className="text-lg font-semibold">Explore</h2>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <li>
            <Link href="/wisdom" className="block rounded border border-[var(--rule)] p-3 hover:border-[var(--accent)]">
              <span className="font-medium">Wisdom</span>
              <span className="block text-[var(--ink-soft)]">Top-scored quotes by theme + virtue</span>
            </Link>
          </li>
          <li>
            <Link href="/stoics" className="block rounded border border-[var(--rule)] p-3 hover:border-[var(--accent)]">
              <span className="font-medium">The Stoics</span>
              <span className="block text-[var(--ink-soft)]">Zeno → Marcus, 8 profile pages</span>
            </Link>
          </li>
          <li>
            <Link href="/books" className="block rounded border border-[var(--rule)] p-3 hover:border-[var(--accent)]">
              <span className="font-medium">Books</span>
              <span className="block text-[var(--ink-soft)]">Canonical texts, readable inline</span>
            </Link>
          </li>
          <li>
            <Link href="/stoicism" className="block rounded border border-[var(--rule)] p-3 hover:border-[var(--accent)]">
              <span className="font-medium">Stoicism — the guide</span>
              <span className="block text-[var(--ink-soft)]">Intro / intermediate / deep tracks</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="text-xs text-[var(--ink-soft)]">
        <p>
          Health check:{" "}
          <Link href="/api/health" className="underline">
            /api/health
          </Link>
        </p>
      </section>
    </div>
  );
}
