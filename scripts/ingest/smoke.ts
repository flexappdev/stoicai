// Phase 1 smoke harness — exercises Gutenberg fetcher, chunker, and the
// per-work loaders end-to-end. Dry-run (no DB writes). Also pings the
// Supabase schema and reports whether migration 0001 has been applied.

import { loadMeditations } from "./meditations";
import { loadEnchiridion } from "./enchiridion";
import { pingSchema } from "./db";

async function main() {
  console.log("=== StoicAI Phase 1 smoke ===\n");

  console.log("→ Enchiridion (Higginson)");
  const ench = await loadEnchiridion();
  console.log(`  ${ench.length} items`);
  ench.slice(0, 2).forEach((c) => {
    console.log(`    [${c.source_ref}] ${c.text.slice(0, 100).replace(/\s+/g, " ")}…`);
  });

  console.log("\n→ Meditations (Long)");
  const med = await loadMeditations();
  console.log(`  ${med.length} items`);
  med.slice(0, 2).forEach((c) => {
    console.log(`    [${c.source_ref}] ${c.text.slice(0, 100).replace(/\s+/g, " ")}…`);
  });

  console.log("\n→ Supabase schema");
  try {
    const ping = await pingSchema();
    if (ping.schema_ready) {
      console.log("  ✓ All 7 tables exist");
      console.log("  table_counts:", ping.table_counts);
    } else {
      console.log("  ⚠ migration 0001 not applied yet");
      console.log("  missing:", ping.missing.join(", "));
      console.log("  apply via Supabase Studio SQL editor or PAT, then ingest can write.");
    }
  } catch (e) {
    console.log("  ⚠ pingSchema failed:", e instanceof Error ? e.message : String(e));
  }

  console.log(
    `\n✓ Phase 1 primitives + loaders functional · ${ench.length + med.length} items ready`,
  );
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
