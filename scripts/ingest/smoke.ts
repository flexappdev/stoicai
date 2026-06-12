// Phase 1 smoke harness — fetches Enchiridion + Meditations Book 1 from Gutenberg
// and runs the chunker against them. No DB writes. Verifies the two primitives
// from PBI-1.1 + PBI-1.2 work end-to-end.

import { fetchGutenberg, STOIC_GUTENBERG } from "./gutenberg";
import { chunk } from "./chunker";

async function main() {
  console.log("=== StoicAI Phase 1 smoke ===\n");

  console.log(`→ Enchiridion (gutenberg ${STOIC_GUTENBERG.enchiridion_higginson})`);
  const ench = await fetchGutenberg(STOIC_GUTENBERG.enchiridion_higginson);
  console.log(`  ${ench.bytes} bytes, ${ench.lines} lines`);
  const enchChunks = chunk(ench.body, { mode: "enchiridion" });
  console.log(`  ${enchChunks.length} chunks parsed`);
  enchChunks.slice(0, 3).forEach((c) => {
    console.log(`    [${c.ref}] ${c.text.slice(0, 100).replace(/\s+/g, " ")}…`);
  });

  console.log(`\n→ Meditations (gutenberg ${STOIC_GUTENBERG.meditations_long})`);
  const med = await fetchGutenberg(STOIC_GUTENBERG.meditations_long);
  console.log(`  ${med.bytes} bytes, ${med.lines} lines`);
  const medChunks = chunk(med.body, { mode: "meditations" });
  console.log(`  ${medChunks.length} chunks parsed`);
  medChunks.slice(0, 3).forEach((c) => {
    console.log(`    [${c.ref}] ${c.text.slice(0, 100).replace(/\s+/g, " ")}…`);
  });

  console.log("\n✓ Phase 1 primitives functional");
  console.log(`  Combined: ${enchChunks.length + medChunks.length} chunks ready for stoic_items insert`);
}

main().catch((e) => {
  console.error("✗", e);
  process.exit(1);
});
