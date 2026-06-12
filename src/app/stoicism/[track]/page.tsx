import Link from "next/link";
import { notFound } from "next/navigation";
import { TRACKS, type Track } from "@/lib/concepts-data";

export function generateStaticParams() {
  return TRACKS.map((t) => ({ track: t.slug }));
}

interface Props {
  params: Promise<{ track: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { track } = await params;
  const t = TRACKS.find((x) => x.slug === track);
  if (!t) return { title: "Track — not found" };
  return {
    title: `Stoicism — ${t.label} — StoicAI`,
    description: t.desc,
  };
}

export default async function TrackPage({ params }: Props) {
  const { track } = await params;
  const t = TRACKS.find((x) => x.slug === (track as Track));
  if (!t) notFound();
  const concepts = t.concepts();

  return (
    <article className="flex flex-col gap-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium flex items-center gap-2">
          <Link href="/stoicism" className="hover:underline">Stoicism</Link>
          <span>·</span>
          <span>{t.label} track</span>
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">{t.label}</h1>
        <p className="text-[var(--ink-soft)] max-w-2xl mt-3">{t.desc}</p>
      </header>

      <ol className="flex flex-col gap-2">
        {concepts.map((c, i) => (
          <li key={c.slug}>
            <Link
              href={`/stoicism/concept/${c.slug}` as never}
              className="block rounded border border-[var(--rule)] p-4 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40 transition-colors"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium">
                  {i + 1}. {c.name}
                </span>
                {c.greek && (
                  <span className="text-[11px] text-[var(--ink-soft)] italic">{c.greek}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{c.one_liner}</p>
            </Link>
          </li>
        ))}
      </ol>

      <nav className="text-sm flex items-center justify-between text-[var(--ink-soft)]">
        <Link href="/stoicism" className="hover:text-[var(--accent)]">← All tracks</Link>
        <div className="flex gap-3">
          {TRACKS.filter((x) => x.slug !== t.slug).map((x) => (
            <Link key={x.slug} href={`/stoicism/${x.slug}` as never} className="hover:text-[var(--accent)]">
              {x.label}
            </Link>
          ))}
        </div>
      </nav>
    </article>
  );
}
