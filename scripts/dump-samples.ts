// Utility: dump the first N items from each loader to JSON files for
// dry-run enrichment / embedding without touching the DB.
//
// Usage:
//   tsx scripts/dump-samples.ts [count=10]
//   → writes scripts/samples/meditations.json + enchiridion.json

import fs from "node:fs/promises";
import path from "node:path";
import { loadMeditations } from "./ingest/meditations";
import { loadEnchiridion } from "./ingest/enchiridion";

async function main() {
  const n = Number(process.argv[2] ?? 10);
  const outDir = path.resolve(__dirname, "samples");
  await fs.mkdir(outDir, { recursive: true });

  const med = (await loadMeditations()).slice(0, n);
  const ench = (await loadEnchiridion()).slice(0, n);

  await fs.writeFile(path.join(outDir, "meditations.json"), JSON.stringify(med, null, 2));
  await fs.writeFile(path.join(outDir, "enchiridion.json"), JSON.stringify(ench, null, 2));
  console.log(`✓ ${med.length} Meditations → ${path.join(outDir, "meditations.json")}`);
  console.log(`✓ ${ench.length} Enchiridion → ${path.join(outDir, "enchiridion.json")}`);
}

main().catch((e) => {
  console.error("✗", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
