import Link from "next/link";
import WisdomGrid from "@/components/WisdomGrid";
import { dailyPick } from "@/lib/wisdom-data";
import { getStoic } from "@/lib/stoics-data";

export const metadata = {
  title: "Wisdom — StoicAI",
  description: "30 hand-picked top-quality Stoic passages from Marcus, Seneca, Epictetus, and Musonius — filter by theme, virtue, author, or context.",
};

interface Props {
  searchParams: Promise<{ theme?: string }>;
}

export default async function WisdomPage({ searchParams }: Props) {
  const { theme } = await searchParams;
  const pick = dailyPick();
  const author = getStoic(pick.author_slug);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Wisdom</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
          Top-scored passages, filterable and citable.
        </h1>
        <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
          A curated set of {30}+ memorable passages from the corpus. Filter by theme (anger,
          control, time, death…), virtue, author, or use-context (morning, crisis, decision).
          Click any chip to refine; click a quote's <em>copy</em> button to share. The full
          10K-item dataset takes over once Phase 1 ingest unblocks.
        </p>
      </header>

      <section className="rounded-lg border-2 border-[var(--accent)] bg-[var(--accent-soft)] p-5">
        <p className="text-xs uppercase tracking-wider text-[var(--accent-strong)] font-medium">
          Daily pick · {new Date().toISOString().slice(0, 10)}
        </p>
        <blockquote className="mt-2 text-lg leading-relaxed text-[var(--ink)]">
          &ldquo;{pick.text}&rdquo;
        </blockquote>
        <div className="mt-3 flex items-baseline justify-between text-sm">
          <Link href={`/stoics/${pick.author_slug}` as never} className="text-[var(--accent-strong)] hover:underline">
            — {author?.name ?? pick.author_slug}
          </Link>
          <span className="font-mono text-[var(--ink-soft)]">{pick.source_ref}</span>
        </div>
      </section>

      <WisdomGrid initialTheme={theme} />
    </div>
  );
}
