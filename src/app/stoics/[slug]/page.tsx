import Link from "next/link";
import { notFound } from "next/navigation";
import { STOICS, getStoic, worksByAuthor, formatYears } from "@/lib/stoics-data";

export function generateStaticParams() {
  return STOICS.map((s) => ({ slug: s.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const s = getStoic(slug);
  if (!s) return { title: "Stoic — not found" };
  return {
    title: `${s.name} — StoicAI`,
    description: `${s.one_liner} (${formatYears(s.birth_year, s.death_year)})`,
  };
}

export default async function StoicProfile({ params }: Props) {
  const { slug } = await params;
  const stoic = getStoic(slug);
  if (!stoic) notFound();
  const works = worksByAuthor(stoic.slug);

  const prevIdx = STOICS.findIndex((s) => s.slug === stoic.slug) - 1;
  const nextIdx = prevIdx + 2;
  const prev = prevIdx >= 0 ? STOICS[prevIdx] : null;
  const next = nextIdx < STOICS.length ? STOICS[nextIdx] : null;

  return (
    <article className="flex flex-col gap-6">
      <header className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium flex items-center gap-2">
          <Link href="/stoics" className="hover:underline">The Stoics</Link>
          <span>·</span>
          <span>{stoic.era === "early" ? "Early Stoa" : "Roman Stoa"}</span>
          <span>·</span>
          <span className="font-mono normal-case tracking-normal">{formatYears(stoic.birth_year, stoic.death_year)}</span>
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">{stoic.name}</h1>
        <p className="mt-2 text-[var(--ink-soft)] italic">{stoic.one_liner}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {stoic.themes.map((t) => (
            <Link
              key={t}
              href={`/wisdom?theme=${t}` as never}
              className="rounded bg-[var(--accent-soft)] text-[var(--accent-strong)] px-2 py-1 hover:bg-[var(--accent)] hover:text-white"
            >
              #{t}
            </Link>
          ))}
        </div>
      </header>

      <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <h2 className="text-lg font-semibold">Life</h2>
        <p className="mt-3 text-[var(--ink-soft)] leading-relaxed">{stoic.bio}</p>
      </section>

      {works.length > 0 && (
        <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
          <h2 className="text-lg font-semibold">Works</h2>
          <ul className="mt-3 divide-y divide-[var(--rule)] border border-[var(--rule)] rounded">
            {works.map((w) => (
              <li key={w.slug} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <Link href={`/books/${w.slug}` as never} className="font-medium hover:text-[var(--accent)]">
                  {w.title}
                </Link>
                <span className="text-xs text-[var(--ink-soft)] font-mono">
                  {w.translator} ({w.translation_year}) · ~{w.est_chunks.toLocaleString()} chunks
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <h2 className="text-lg font-semibold">Top passages</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Pulls top-scored items by {stoic.name} from the corpus. Live once Phase 1.6 ingest writes
          to <span className="font-mono">stoic_items</span> and Phase 2.1 enrichment populates{" "}
          <span className="font-mono">quality_score</span>.
        </p>
        <div className="mt-4 rounded border border-dashed border-[var(--rule)] p-4 text-sm text-[var(--ink-soft)]">
          <p>
            Awaiting ingest. Until then, talk to the{" "}
            <Link href="/" className="text-[var(--accent)] hover:underline">
              Stoic mentor
            </Link>{" "}
            about <em>&ldquo;What does {stoic.name.split(" ")[0]} mean by…&rdquo;</em>
          </p>
        </div>
      </section>

      <nav className="flex items-center justify-between text-sm text-[var(--ink-soft)]">
        <div>
          {prev && (
            <Link href={`/stoics/${prev.slug}` as never} className="hover:text-[var(--accent)]">
              ← {prev.name}
            </Link>
          )}
        </div>
        <Link href="/stoics" className="hover:text-[var(--accent)]">All Stoics</Link>
        <div>
          {next && (
            <Link href={`/stoics/${next.slug}` as never} className="hover:text-[var(--accent)]">
              {next.name} →
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
