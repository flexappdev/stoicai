// PBI-5.3 (part) — Discourses of Epictetus loader (Long trans.)
// Gutenberg #10661. Mode: discourses → BOOK N + CHAPTER N hierarchy.

import { fetchGutenberg, STOIC_GUTENBERG } from "./gutenberg";
import { chunk } from "./chunker";
import { StoicItemInsert, upsertItems, pingSchema } from "./db";

const AUTHOR = "epictetus";
const WORK = "discourses";
const TRANSLATION = "George Long (1890)";

export async function loadDiscourses(): Promise<StoicItemInsert[]> {
  const g = await fetchGutenberg(STOIC_GUTENBERG.discourses_long);
  const chunks = chunk(g.body, { mode: "discourses" });
  return chunks.map((c) => ({
    type: "passage" as const,
    text: c.text,
    author_slug: AUTHOR,
    work_slug: WORK,
    // Strip leading "Discourses." that the chunker emits when no BOOK header
    // was detected (PG#10661 is the Higginson selection — flat, no books).
    source_ref: `Discourses ${c.ref.replace(/^Discourses\./, "")}`,
    translation: TRANSLATION,
    themes: [],
    difficulty: "intermediate" as const,
    use_contexts: [],
    quality_score: 50,
    verified: false,
  }));
}

async function main() {
  const insert = process.argv.includes("--insert");
  const items = await loadDiscourses();
  if (!insert) {
    console.error(`✓ Discourses: ${items.length} items (dry-run)`);
    for (const it of items.slice(0, 3)) {
      console.error(`  [${it.source_ref}] ${it.text.slice(0, 90).replace(/\s+/g, " ")}…`);
    }
    return;
  }
  const ping = await pingSchema();
  if (!ping.schema_ready) {
    console.error(`✗ schema missing: ${ping.missing.join(", ")}`);
    process.exit(2);
  }
  const r = await upsertItems(items);
  console.log(`✓ Discourses: inserted ${r.inserted} in ${r.batches} batches`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
