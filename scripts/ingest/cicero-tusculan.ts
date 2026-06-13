// PBI-5.3 (part) — Cicero Tusculan Disputations loader.
// Gutenberg #14988. Stoic-adjacent — flag accordingly. Mode: paragraphs.

import { fetchGutenberg, STOIC_GUTENBERG } from "./gutenberg";
import { chunk } from "./chunker";
import { StoicItemInsert, upsertItems, pingSchema } from "./db";

const WORK = "cicero-tusculan";
const TRANSLATION = "C. D. Yonge (1877)";

export async function loadCiceroTusculan(): Promise<StoicItemInsert[]> {
  const g = await fetchGutenberg(STOIC_GUTENBERG.cicero_tusculan);
  const chunks = chunk(g.body, { mode: "paragraphs", refPrefix: "tusc", maxLen: 1600 });
  return chunks.map((c) => ({
    type: "passage" as const,
    text: c.text,
    author_slug: null,
    work_slug: WORK,
    source_ref: `Cicero, Tusculan ${c.ref}`,
    translation: TRANSLATION,
    themes: [],
    difficulty: "deep" as const,
    use_contexts: [],
    quality_score: 50,
    verified: false,
    stoic_adjacent: true,
  }));
}

async function main() {
  const insert = process.argv.includes("--insert");
  const items = await loadCiceroTusculan();
  if (!insert) {
    console.error(`✓ Cicero Tusculan: ${items.length} items (dry-run)`);
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
  console.log(`✓ Cicero Tusculan: inserted ${r.inserted} in ${r.batches} batches`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
