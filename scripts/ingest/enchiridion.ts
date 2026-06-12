// PBI-1.4 — Enchiridion loader
// Fetches Epictetus' Enchiridion (Higginson trans.), chunks by chapter,
// returns / inserts StoicItemInsert[] rows. Higginson's edition has 53
// chapters; long chapters get sub-chunked by the passage-aware chunker.
//
// Usage:
//   tsx scripts/ingest/enchiridion.ts            # dry-run, prints JSON to stdout
//   tsx scripts/ingest/enchiridion.ts --insert   # writes to Supabase

import { fetchGutenberg, STOIC_GUTENBERG } from "./gutenberg";
import { chunk } from "./chunker";
import { StoicItemInsert, upsertItems, pingSchema } from "./db";

const AUTHOR = "epictetus";
const WORK = "enchiridion";
const TRANSLATION = "T. W. Higginson (1865)";

export async function loadEnchiridion(): Promise<StoicItemInsert[]> {
  const g = await fetchGutenberg(STOIC_GUTENBERG.enchiridion_higginson);
  const chunks = chunk(g.body, { mode: "enchiridion" });
  return chunks.map((c) => ({
    type: "maxim" as const,
    text: c.text,
    author_slug: AUTHOR,
    work_slug: WORK,
    source_ref: `Enchiridion ${c.ref}`,
    translation: TRANSLATION,
    themes: [],
    difficulty: "intro" as const,
    use_contexts: [],
    quality_score: 50,
    verified: false,
  }));
}

async function main() {
  const insert = process.argv.includes("--insert");
  const items = await loadEnchiridion();
  if (!insert) {
    console.error(`✓ Enchiridion: ${items.length} items (dry-run)`);
    for (const it of items.slice(0, 3)) {
      console.error(`  [${it.source_ref}] ${it.text.slice(0, 90).replace(/\s+/g, " ")}…`);
    }
    process.stdout.write(JSON.stringify(items.slice(0, 5), null, 2));
    return;
  }
  const ping = await pingSchema();
  if (!ping.schema_ready) {
    console.error(`✗ Supabase schema missing tables: ${ping.missing.join(", ")}`);
    console.error("  Apply supabase/migrations/0001_stoic_schema.sql first.");
    process.exit(2);
  }
  const r = await upsertItems(items);
  console.log(`✓ Enchiridion: inserted ${r.inserted} in ${r.batches} batches`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
