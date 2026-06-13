import Link from "next/link";
import { notFound } from "next/navigation";
import { CONCEPTS, getConcept } from "@/lib/concepts-data";
import { getStoic } from "@/lib/stoics-data";

export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ slug: c.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = getConcept(slug);
  if (!c) return { title: "Concept — not found" };
  return {
    title: `${c.name} — StoicAI`,
    description: c.one_liner,
  };
}

export default async function ConceptPage({ params }: Props) {
  const { slug } = await params;
  const c = getConcept(slug);
  if (!c) notFound();

  const trackIdx = CONCEPTS.findIndex((x) => x.slug === c.slug);
  const prev = trackIdx > 0 ? CONCEPTS[trackIdx - 1] : null;
  const next = trackIdx < CONCEPTS.length - 1 ? CONCEPTS[trackIdx + 1] : null;

  return (
    <article className="flex flex-col gap-6">
      <header className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium flex items-center gap-2 flex-wrap">
          <Link href="/stoicism" className="hover:underline">Stoicism</Link>
          <span>·</span>
          <Link href={`/stoicism/${c.track}` as never} className="hover:underline">{c.track} track</Link>
          {c.greek && (
            <>
              <span>·</span>
              <span className="italic normal-case tracking-normal">{c.greek}</span>
            </>
          )}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">{c.name}</h1>
        <p className="mt-2 text-[var(--ink-soft)] italic">{c.one_liner}</p>
      </header>

      <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <p className="text-[var(--ink-soft)] leading-relaxed">{c.body}</p>
      </section>

      {c.associated_stoics && c.associated_stoics.length > 0 && (
        <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
          <h2 className="text-lg font-semibold">Whose idea?</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {c.associated_stoics.map((s) => {
              const st = getStoic(s);
              if (!st) return null;
              return (
                <li key={s}>
                  <Link
                    href={`/stoics/${s}` as never}
                    className="inline-block rounded border border-[var(--rule)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {st.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {c.see_also && c.see_also.length > 0 && (
        <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
          <h2 className="text-lg font-semibold">See also</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {c.see_also.map((s) => {
              const co = getConcept(s);
              if (!co) return null;
              return (
                <li key={s}>
                  <Link
                    href={`/stoicism/concept/${s}` as never}
                    className="inline-block rounded border border-[var(--rule)] px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {co.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <h2 className="text-lg font-semibold">Talk it through</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Ask the{" "}
          <Link href="/" className="text-[var(--accent)] hover:underline">
            Stoic mentor
          </Link>{" "}
          how to put <em>{c.name.toLowerCase()}</em> into practice today, or to show you how it
          handles a specific situation you&apos;re facing.
        </p>
      </section>

      <nav className="text-sm flex items-center justify-between text-[var(--ink-soft)]">
        {prev ? (
          <Link href={`/stoicism/concept/${prev.slug}` as never} className="hover:text-[var(--accent)]">
            ← {prev.name}
          </Link>
        ) : <span />}
        <Link href={`/stoicism/${c.track}` as never} className="hover:text-[var(--accent)]">
          All {c.track} concepts
        </Link>
        {next ? (
          <Link href={`/stoicism/concept/${next.slug}` as never} className="hover:text-[var(--accent)]">
            {next.name} →
          </Link>
        ) : <span />}
      </nav>
    </article>
  );
}
