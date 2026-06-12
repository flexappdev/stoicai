import Link from "next/link";
import { CONCEPTS, TRACKS } from "@/lib/concepts-data";

export const metadata = {
  title: "Stoicism — the guide — StoicAI",
  description: "Intro, intermediate, and deep tracks through Stoic philosophy: dichotomy of control, premeditatio malorum, oikeiosis, logos, and the practices that put them to work.",
};

export default function StoicismPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Stoicism — the guide</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">A working manual, not a museum tour.</h1>
        <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
          Three tracks. {CONCEPTS.length} concepts. Read them cold or follow the order; either way
          each entry is short, anchored in a named Stoic, and points to the practice that makes the
          idea load-bearing.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TRACKS.map((t) => (
          <Link
            key={t.slug}
            href={`/stoicism/${t.slug}` as never}
            className="rounded border border-[var(--rule)] p-4 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40 transition-colors"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{t.label}</span>
              <span className="text-[10px] font-mono text-[var(--ink-soft)]">{t.concepts().length} concepts</span>
            </div>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.desc}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <h2 className="text-lg font-semibold">All concepts</h2>
        <ul className="mt-4 divide-y divide-[var(--rule)] border border-[var(--rule)] rounded">
          {CONCEPTS.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/stoicism/concept/${c.slug}` as never}
                className="block p-3 hover:bg-[var(--accent-soft)]/50 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-soft)]">{c.track}</span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--ink-soft)]">{c.one_liner}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
