// PBI-1.5 — Letters to Lucilius (Gummere translation, Wikisource).
//
// Wikisource hosts the canonical Gummere Loeb translation at:
//   https://en.wikisource.org/wiki/Moral_letters_to_Lucilius/Letter_N
// for N=1..124. We fetch each rendered HTML page, extract body paragraphs,
// emit one StoicItemInsert per paragraph with source_ref `Letters N.M`.
//
// Usage:
//   tsx scripts/ingest/letters-lucilius.ts            # dry-run summary
//   tsx scripts/ingest/letters-lucilius.ts --insert   # write to DB
//   tsx scripts/ingest/letters-lucilius.ts --letters 1-10   # subset
//
// Rate limit: ≤1 letter / second per WMF policy. Caches to disk.

import { fetchWikisourceHtml, extractParagraphs } from "./wikisource";
import { StoicItemInsert, upsertItems, pingSchema } from "./db";

const AUTHOR = "seneca";
const WORK = "letters-lucilius";
const TRANSLATION = "Richard M. Gummere (Loeb, 1917 — public domain)";

interface CliOpts {
  insert: boolean;
  from: number;
  to: number;
}

function parseArgs(): CliOpts {
  const argv = process.argv.slice(2);
  const opts: CliOpts = { insert: false, from: 1, to: 124 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--insert") opts.insert = true;
    else if (a === "--letters") {
      const range = argv[++i];
      const m = range.match(/^(\d+)-(\d+)$/);
      if (m) {
        opts.from = Number(m[1]);
        opts.to = Number(m[2]);
      } else {
        opts.from = Number(range);
        opts.to = opts.from;
      }
    }
  }
  return opts;
}

export async function loadLetter(n: number): Promise<StoicItemInsert[]> {
  const title = `Moral_letters_to_Lucilius/Letter_${n}`;
  const html = await fetchWikisourceHtml(title);
  const paragraphs = extractParagraphs(html);
  return paragraphs.map((p, i) => ({
    type: "letter" as const,
    text: p,
    author_slug: AUTHOR,
    work_slug: WORK,
    source_ref: `Letters ${n}.${i + 1}`,
    translation: TRANSLATION,
    themes: [],
    difficulty: "intermediate" as const,
    use_contexts: [],
    quality_score: 50,
    verified: false,
  }));
}

async function main() {
  const opts = parseArgs();
  console.error(`→ Wikisource Letters ${opts.from}–${opts.to} (insert=${opts.insert})`);

  const allItems: StoicItemInsert[] = [];
  let letterCount = 0;
  let failed = 0;

  for (let n = opts.from; n <= opts.to; n++) {
    try {
      const items = await loadLetter(n);
      allItems.push(...items);
      letterCount++;
      process.stderr.write(`  · Letter ${n}: ${items.length} paragraphs\n`);
    } catch (e) {
      failed++;
      process.stderr.write(`  ✗ Letter ${n}: ${e instanceof Error ? e.message : String(e)}\n`);
    }
  }

  console.error(
    `\n✓ ${letterCount} letters fetched (${failed} failed), ${allItems.length} items extracted`,
  );
  if (allItems.length > 0) {
    console.error(`  sample: [${allItems[0].source_ref}] ${allItems[0].text.slice(0, 120).replace(/\s+/g, " ")}…`);
  }

  if (!opts.insert) {
    return;
  }

  const ping = await pingSchema();
  if (!ping.schema_ready) {
    console.error(`✗ schema missing: ${ping.missing.join(", ")}`);
    process.exit(2);
  }
  const r = await upsertItems(allItems, { batchSize: 200 });
  console.log(`✓ Letters to Lucilius: inserted ${r.inserted} in ${r.batches} batches`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
