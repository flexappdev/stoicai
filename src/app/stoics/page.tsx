import Link from "next/link";
import { STOICS, formatYears } from "@/lib/stoics-data";

export const metadata = {
  title: "The Stoics — StoicAI",
  description: "Eight philosophers, three centuries: Zeno of Citium to Marcus Aurelius. Profile pages with bio, works, and top cited passages.",
};

export default function StoicsPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">The Stoics</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
        Zeno to Marcus — eight lives in the school.
      </h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        Each profile carries a timeline, the works the philosopher left behind, and their top
        passages from the corpus. Click any to read.
      </p>
      <ol className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STOICS.map((s, i) => (
          <li key={s.slug}>
            <Link
              href={`/stoics/${s.slug}` as never}
              className="block rounded border border-[var(--rule)] p-3 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">
                  {i + 1}. {s.name}
                </span>
                <span className="text-xs text-[var(--ink-soft)] font-mono">
                  {formatYears(s.birth_year, s.death_year)}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{s.one_liner}</p>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                {s.themes.slice(0, 4).map((t) => (
                  <span key={t} className="rounded bg-[var(--paper)] text-[var(--ink-soft)] px-1.5 py-0.5">
                    #{t}
                  </span>
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
