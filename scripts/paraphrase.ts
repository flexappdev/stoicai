// PBI-2.2 — Modern-English paraphrase for top-scored items
//
// Reads top-N items by quality_score from stoic_items (or a JSON sample) and
// asks the LLM to render each in plain modern English — preserving the
// argument exactly, dropping pseudo-classical register. Writes the result
// back into text_modern (DB mode) or a JSON sidecar (dry-run).
//
// Usage:
//   tsx scripts/paraphrase.ts                                # DB mode, top-1000 quality
//   tsx scripts/paraphrase.ts --input items.json [--limit N] # dry-run

import fs from "node:fs/promises";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";
import { llmCall } from "../src/lib/llm";
import { adminClient, pingSchema, type StoicItemInsert } from "./ingest/db";

dotenvConfig({ path: path.resolve(process.cwd(), ".env.local") });

const PARAPHRASE_SYSTEM = `You are a careful translator. Take each Stoic passage and render it in clear modern English. RULES:

1. Preserve the argument exactly. Do not add ideas the original lacks; do not drop ideas it has.
2. Use plain modern register. No "thee", "thou", "shall", "art", "hath", "wherefore". Write as if for a contemporary reader.
3. Keep specifics (proper nouns, citations of figures by name, concrete objects). Don't generalize them away.
4. One short paragraph per item. Tight sentences.
5. Do NOT add commentary, framing, or your own opinions. Output is ONLY the modernized passage.

Return a JSON ARRAY in the same order as input. Each element is just the modernized string. No object wrappers, no markdown fences, no commentary.`;

function buildBatchPrompt(items: StoicItemInsert[]): string {
  const lines = items.map(
    (it, i) =>
      `${i + 1}. [${it.source_ref ?? "—"}]\n   ${it.text.slice(0, 800).replace(/\s+/g, " ")}`,
  );
  return `Render these ${items.length} passages into clear modern English. Return a JSON array of ${items.length} strings in order.\n\n${lines.join("\n\n")}`;
}

export async function paraphraseBatch(items: StoicItemInsert[]): Promise<string[]> {
  if (items.length === 0) return [];
  const r = await llmCall({
    tier: "balanced",
    system: PARAPHRASE_SYSTEM,
    messages: [{ role: "user", content: buildBatchPrompt(items) }],
    maxTokens: Math.min(8192, 512 * items.length),
    temperature: 0.4,
  });
  const cleaned = r.content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`paraphraseBatch: non-JSON response (${(e as Error).message.slice(0, 80)}): ${cleaned.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed) || parsed.length !== items.length) {
    throw new Error(`paraphraseBatch: expected ${items.length} strings, got ${Array.isArray(parsed) ? parsed.length : typeof parsed}`);
  }
  return parsed.map((s, i) => {
    if (typeof s !== "string" || s.trim().length === 0) {
      throw new Error(`paraphraseBatch: invalid element at ${i}`);
    }
    return s.trim();
  });
}

interface CliOpts {
  input?: string;
  output?: string;
  limit: number;
  batchSize: number;
  minQuality: number;
}

function parseArgs(): CliOpts {
  const argv = process.argv.slice(2);
  const opts: CliOpts = { limit: 1000, batchSize: 8, minQuality: 70 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") opts.input = argv[++i];
    else if (a === "--output") opts.output = argv[++i];
    else if (a === "--limit") opts.limit = Number(argv[++i]);
    else if (a === "--batch") opts.batchSize = Number(argv[++i]);
    else if (a === "--min-quality") opts.minQuality = Number(argv[++i]);
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const isDry = !!opts.input;

  let items: StoicItemInsert[];
  if (isDry) {
    const buf = await fs.readFile(opts.input!, "utf8");
    const arr = JSON.parse(buf) as StoicItemInsert[];
    items = arr.slice(0, opts.limit);
    console.error(`→ dry-run: ${items.length} items from ${opts.input}`);
  } else {
    const ping = await pingSchema();
    if (!ping.schema_ready) {
      console.error(`✗ schema missing: ${ping.missing.join(", ")}`);
      process.exit(2);
    }
    const sb = adminClient();
    const { data, error } = await sb
      .from("stoic_items")
      .select("id, text, source_ref, author_slug")
      .gte("quality_score", opts.minQuality)
      .is("text_modern", null)
      .order("quality_score", { ascending: false })
      .limit(opts.limit);
    if (error) throw error;
    if (!data || data.length === 0) {
      console.log("✓ nothing to paraphrase.");
      return;
    }
    items = data as unknown as StoicItemInsert[];
    console.error(`→ DB mode: ${items.length} items at quality >= ${opts.minQuality}`);
  }

  const enriched: { input: StoicItemInsert; text_modern: string }[] = [];
  for (let i = 0; i < items.length; i += opts.batchSize) {
    const batch = items.slice(i, i + opts.batchSize);
    process.stderr.write(`  · batch ${Math.floor(i / opts.batchSize) + 1} (${batch.length} items)…`);
    try {
      const out = await paraphraseBatch(batch);
      enriched.push(...batch.map((b, j) => ({ input: b, text_modern: out[j] })));
      process.stderr.write(` ✓\n`);
    } catch (e) {
      process.stderr.write(`\n    ✗ ${e instanceof Error ? e.message : String(e)}\n`);
    }
  }
  console.error(`✓ paraphrased ${enriched.length}/${items.length} items`);

  if (isDry) {
    const target = opts.output ?? opts.input!.replace(/\.json$/, "") + ".paraphrased.json";
    const merged = enriched.map((r) => ({ ...r.input, text_modern: r.text_modern }));
    await fs.writeFile(target, JSON.stringify(merged, null, 2));
    console.error(`→ wrote ${merged.length} → ${target}`);
    for (const r of enriched.slice(0, 2)) {
      console.error(`  sample [${r.input.source_ref}]:`);
      console.error(`    original:  ${r.input.text.slice(0, 90).replace(/\s+/g, " ")}…`);
      console.error(`    modern:    ${r.text_modern.slice(0, 90).replace(/\s+/g, " ")}…`);
    }
    return;
  }

  const sb = adminClient();
  let updated = 0;
  for (const row of enriched) {
    const id = (row.input as unknown as { id: string }).id;
    if (!id) continue;
    const upd = await sb
      .from("stoic_items")
      .update({ text_modern: row.text_modern })
      .eq("id", id)
      .select("id");
    if (!upd.error) updated += upd.data?.length ?? 0;
  }
  console.log(`✓ updated ${updated} rows with text_modern`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
