// PBI-1.3 — Meditations loader
// Fetches Marcus Aurelius' Meditations from Gutenberg (George Long translation),
// chunks by book.passage, returns / inserts StoicItemInsert[] rows.
//
// Usage:
//   tsx scripts/ingest/meditations.ts            # dry-run, prints JSON to stdout
//   tsx scripts/ingest/meditations.ts --insert   # writes to Supabase (needs schema applied)

import { fetchGutenberg, STOIC_GUTENBERG } from "./gutenberg";
import { chunk } from "./chunker";
import { StoicItemInsert, upsertItems, pingSchema } from "./db";

const AUTHOR = "marcus";
const WORK = "meditations";
const TRANSLATION = "George Long (1862)";

export async function loadMeditations(): Promise<StoicItemInsert[]> {
  const g = await fetchGutenberg(STOIC_GUTENBERG.meditations_long);
  const chunks = chunk(g.body, { mode: "meditations" });
  return chunks.map((c) => ({
    type: "meditation" as const,
    text: c.text,
    author_slug: AUTHOR,
    work_slug: WORK,
    source_ref: `Meditations ${c.ref}`,
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
  const items = await loadMeditations();
  if (!insert) {
    console.error(`✓ Meditations: ${items.length} items (dry-run)`);
    for (const it of items.slice(0, 3)) {
      console.error(`  [${it.source_ref}] ${it.text.slice(0, 90).replace(/\s+/g, " ")}…`);
    }
    process.stdout.write(JSON.stringify(items.slice(0, 5), null, 2));
    return;
  }
  const ping = await pingSchema();
  if (!ping.schema_ready) {
    console.error(`✗ Supabase schema missing tables: ${ping.missing.join(", ")}`);
    console.error("  Apply supabase/migrations/0001_stoic_schema.sql first (Studio SQL editor or PAT).");
    process.exit(2);
  }
  const r = await upsertItems(items);
  console.log(`✓ Meditations: inserted ${r.inserted} in ${r.batches} batches`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
