import Link from "next/link";
import { notFound } from "next/navigation";
import { loadBook, groupByBook } from "@/lib/book-loader";
import { getStoic, WORKS } from "@/lib/stoics-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return WORKS.map((w) => ({ slug: w.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ch?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const book = await loadBook(slug);
  if (!book) return { title: "Book — not found" };
  return {
    title: `${book.title} — StoicAI`,
    description: `${book.title}, ${book.translator} (${book.translation_year}) — ${book.chapters.length} chapters online.`,
  };
}

const PAGE_SIZE = 10;

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const book = await loadBook(slug);
  if (!book) notFound();

  const author = book.author_slug ? getStoic(book.author_slug) : null;
  const page = Math.max(1, Number(sp.ch ?? "1"));
  const totalPages = Math.max(1, Math.ceil(book.chapters.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const slice = book.chapters.slice(start, start + PAGE_SIZE);
  const groups = groupByBook(slice);

  return (
    <article className="flex flex-col gap-6">
      <header className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium flex items-center gap-2 flex-wrap">
          <Link href="/books" className="hover:underline">Books</Link>
          <span>·</span>
          {author && <Link href={`/stoics/${author.slug}` as never} className="hover:underline normal-case tracking-normal">{author.name}</Link>}
          <span>·</span>
          <span className="font-mono normal-case tracking-normal">{book.translator}, {book.translation_year}</span>
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">{book.title}</h1>
        {book.chapters.length > 0 && (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {book.chapters.length.toLocaleString()} chapters · page {safePage} of {totalPages} ·
            {book.source_url && (
              <>
                {" "}
                <a
                  href={book.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] hover:underline"
                >
                  Project Gutenberg source
                </a>
              </>
            )}
          </p>
        )}
        {book.note && (
          <div className="mt-3 rounded border border-dashed border-[var(--rule)] p-3 text-sm text-[var(--ink-soft)]">
            {book.note}
          </div>
        )}
      </header>

      {book.chapters.length > 0 && (
        <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-4 sm:p-6 flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.book} className="flex flex-col gap-3">
              {g.book !== "—" && (
                <h2 className="text-sm uppercase tracking-wider text-[var(--accent)] font-medium">
                  Book {g.book}
                </h2>
              )}
              <div className="flex flex-col gap-3">
                {g.items.map((c) => (
                  <div key={c.ref} className="border-l-2 border-[var(--accent-soft)] pl-4 py-1">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)] font-mono">
                      {c.ref}
                    </p>
                    <p className="mt-1 text-[var(--ink)] leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {book.chapters.length > 0 && (
        <nav className="flex items-center justify-between text-sm">
          <Link
            href={`/books/${slug}${safePage > 1 ? `?ch=${safePage - 1}` : ""}` as never}
            className={
              safePage > 1
                ? "text-[var(--accent)] hover:underline"
                : "text-[var(--ink-soft)] pointer-events-none"
            }
            aria-disabled={safePage <= 1}
          >
            ← Page {Math.max(1, safePage - 1)}
          </Link>
          <span className="text-[var(--ink-soft)] font-mono text-xs">
            {start + 1}–{Math.min(start + PAGE_SIZE, book.chapters.length)} of {book.chapters.length}
          </span>
          <Link
            href={`/books/${slug}?ch=${safePage + 1}` as never}
            className={
              safePage < totalPages
                ? "text-[var(--accent)] hover:underline"
                : "text-[var(--ink-soft)] pointer-events-none"
            }
            aria-disabled={safePage >= totalPages}
          >
            Page {Math.min(totalPages, safePage + 1)} →
          </Link>
        </nav>
      )}

      <section className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-6">
        <h2 className="text-lg font-semibold">Read with the mentor</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Ask the{" "}
          <Link href="/" className="text-[var(--accent)] hover:underline">
            Stoic mentor
          </Link>{" "}
          to explain any passage on this page or to apply it to a specific situation you&apos;re
          working through.
        </p>
      </section>
    </article>
  );
}
