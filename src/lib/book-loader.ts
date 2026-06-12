// Server-side book loader for /books/[slug].
// Wraps the Gutenberg fetcher + passage-aware chunker behind a simple
// "give me the chapters of this work" interface. Caches to /tmp so we
// don't re-fetch on every render.

import fs from "node:fs/promises";
import path from "node:path";
import { fetchGutenberg, STOIC_GUTENBERG } from "../../scripts/ingest/gutenberg";
import { chunk, type ChunkerOpts } from "../../scripts/ingest/chunker";
import { getWork } from "./stoics-data";

const CACHE_ROOT = process.env.STOICAI_BOOK_CACHE_DIR ?? "/tmp/stoicai-books";

interface SourceConfig {
  gutenberg_id?: string;
  mode: ChunkerOpts["mode"];
  prefix: string;
}

const WORK_SOURCES: Record<string, SourceConfig> = {
  "meditations":   { gutenberg_id: STOIC_GUTENBERG.meditations_long,       mode: "meditations", prefix: "Meditations" },
  "enchiridion":   { gutenberg_id: STOIC_GUTENBERG.enchiridion_higginson,  mode: "enchiridion", prefix: "Enchiridion" },
  "discourses":    { gutenberg_id: STOIC_GUTENBERG.discourses_long,        mode: "discourses",  prefix: "Discourses" },
  "senecan-essays":{ gutenberg_id: STOIC_GUTENBERG.senecan_morals_l_estrange, mode: "paragraphs", prefix: "Seneca" },
  "cicero-tusculan": { gutenberg_id: STOIC_GUTENBERG.cicero_tusculan, mode: "paragraphs", prefix: "Tusculan" },
};

export interface BookChapter {
  ref: string;       // e.g. "1.7" or "Letter 13.4"
  text: string;
  index: number;
}

export interface BookData {
  workSlug: string;
  title: string;
  author_slug: string | null;
  translator: string;
  translation_year: number;
  source_url: string | null;
  chapters: BookChapter[];
  note?: string;
}

async function readCache(key: string): Promise<string | null> {
  try {
    const file = path.join(CACHE_ROOT, `${key}.txt`);
    const stat = await fs.stat(file);
    // 7-day TTL is plenty for PD texts
    if (Date.now() - stat.mtimeMs > 7 * 24 * 60 * 60 * 1000) return null;
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function writeCache(key: string, body: string): Promise<void> {
  try {
    await fs.mkdir(CACHE_ROOT, { recursive: true });
    await fs.writeFile(path.join(CACHE_ROOT, `${key}.txt`), body, "utf8");
  } catch {
    // Best-effort cache; fail-quiet
  }
}

export async function loadBook(workSlug: string): Promise<BookData | null> {
  const work = getWork(workSlug);
  if (!work) return null;
  const src = WORK_SOURCES[workSlug];

  if (!src || !src.gutenberg_id) {
    return {
      workSlug,
      title: work.title,
      author_slug: work.author_slug,
      translator: work.translator,
      translation_year: work.translation_year,
      source_url: work.wikisource_url ?? null,
      chapters: [],
      note:
        work.wikisource_url
          ? `This work isn't on Project Gutenberg — Wikisource hosts the canonical translation page-per-letter at ${work.wikisource_url}. A Wikisource fetcher ships in a later PBI.`
          : "This work doesn't have a Gutenberg fetcher wired yet. Coming online via ingest pipeline.",
    };
  }

  let body: string;
  const cached = await readCache(src.gutenberg_id);
  if (cached) {
    body = cached;
  } else {
    const g = await fetchGutenberg(src.gutenberg_id);
    body = g.body;
    await writeCache(src.gutenberg_id, body);
  }

  const raw = chunk(body, { mode: src.mode });
  const chapters: BookChapter[] = raw.map((r, i) => ({ ref: `${src.prefix} ${r.ref}`, text: r.text, index: i }));

  return {
    workSlug,
    title: work.title,
    author_slug: work.author_slug,
    translator: work.translator,
    translation_year: work.translation_year,
    source_url: `https://www.gutenberg.org/ebooks/${src.gutenberg_id}`,
    chapters,
  };
}

export function groupByBook(chapters: BookChapter[]): { book: string; items: BookChapter[] }[] {
  const map = new Map<string, BookChapter[]>();
  for (const c of chapters) {
    // Take the segment before the first dot as the "book" group, with the
    // last word of the prefix stripped. e.g. "Meditations 1.5" → "1".
    const m = c.ref.match(/(?:^|\s)(\d+)\./);
    const book = m ? m[1] : "—";
    if (!map.has(book)) map.set(book, []);
    map.get(book)!.push(c);
  }
  return Array.from(map.entries()).map(([book, items]) => ({ book, items }));
}
