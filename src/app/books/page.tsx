import Link from "next/link";
import { WORKS, getStoic } from "@/lib/stoics-data";

export const metadata = {
  title: "Books — StoicAI",
  description: "Canonical Stoic works in public-domain translations — Meditations, Enchiridion, Discourses, and more, readable in-app chapter by chapter.",
};

const READABLE = new Set(["meditations", "enchiridion", "discourses", "senecan-essays", "cicero-tusculan"]);

export default function BooksPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Books</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
        Canonical Stoic works — readable in-app.
      </h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        Public-domain translations fetched live from Project Gutenberg and cached locally. Each
        chapter renders inline with the mentor a click away.
      </p>
      <ul className="mt-6 divide-y divide-[var(--rule)] border border-[var(--rule)] rounded">
        {WORKS.map((w) => {
          const author = w.author_slug ? getStoic(w.author_slug) : null;
          const readable = READABLE.has(w.slug);
          return (
            <li key={w.slug} className="hover:bg-[var(--accent-soft)]/30 transition-colors">
              {readable ? (
                <Link
                  href={`/books/${w.slug}` as never}
                  className="block p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                >
                  <div>
                    <span className="font-medium text-[var(--ink)]">{w.title}</span>{" "}
                    <span className="text-[var(--ink-soft)]">— {author?.name ?? "—"}</span>
                  </div>
                  <div className="text-xs text-[var(--ink-soft)] font-mono">
                    {w.translator} ({w.translation_year}) · ~{w.est_chunks.toLocaleString()} chunks
                  </div>
                </Link>
              ) : (
                <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 opacity-70">
                  <div>
                    <span className="font-medium text-[var(--ink)]">{w.title}</span>{" "}
                    <span className="text-[var(--ink-soft)]">— {author?.name ?? "—"}</span>
                  </div>
                  <div className="text-xs text-[var(--ink-soft)] font-mono flex items-center gap-2">
                    <span>
                      {w.translator} ({w.translation_year})
                    </span>
                    <span className="text-[10px] uppercase rounded bg-[var(--paper)] px-1.5 py-0.5">
                      source pivot needed
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
