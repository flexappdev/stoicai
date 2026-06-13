// PBI-5.3 (part) — Senecan essays loader. Uses Gutenberg #56075 which is
// the L'Estrange compilation "Seneca's Morals of a Happy Life, Benefits,
// Anger and Clemency". This is the PG-available substitute for the
// individual modern essay editions (Stewart-trans not on PG).
// Mode: paragraphs (essays don't have a numbered chapter convention here).

import { fetchGutenberg, STOIC_GUTENBERG } from "./gutenberg";
import { chunk } from "./chunker";
import { StoicItemInsert, upsertItems, pingSchema } from "./db";

const AUTHOR = "seneca";
const WORK = "senecan-essays";
const TRANSLATION = "Sir Roger L'Estrange (1882 ed.)";

export async function loadSenecanEssays(): Promise<StoicItemInsert[]> {
  const g = await fetchGutenberg(STOIC_GUTENBERG.senecan_morals_l_estrange);
  const chunks = chunk(g.body, { mode: "paragraphs", refPrefix: "essay", maxLen: 1600 });
  return chunks.map((c) => ({
    type: "passage" as const,
    text: c.text,
    author_slug: AUTHOR,
    work_slug: WORK,
    source_ref: `Seneca · ${c.ref}`,
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
  const items = await loadSenecanEssays();
  if (!insert) {
    console.error(`✓ Senecan essays: ${items.length} items (dry-run)`);
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
  console.log(`✓ Senecan essays: inserted ${r.inserted} in ${r.batches} batches`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
