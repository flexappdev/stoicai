// PBI-2.3 — Embedding generator
//
// Generates 1536-dim embeddings via OpenAI text-embedding-3-small for every
// stoic_items row where embedding IS NULL. Writes back to the `embedding`
// pgvector column. Batches 100 inputs per OpenAI call (their hard cap is
// higher but we keep memory bounded). Idempotent — re-runnable.
//
// Usage:
//   tsx scripts/embed.ts                                        # DB mode
//   tsx scripts/embed.ts --input items.json [--output e.json]   # dry-run
//   tsx scripts/embed.ts --limit 500                            # cap batch
//
// Requires: OPENAI_API_KEY in .env.local (OpenRouter doesn't proxy embeddings).

import fs from "node:fs/promises";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";
import OpenAI from "openai";
import { adminClient, pingSchema, type StoicItemInsert } from "./ingest/db";

dotenvConfig({ path: path.resolve(process.cwd(), ".env.local") });

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIM = 1536;
const BATCH_SIZE = 100;

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY not set in .env.local. Add it from your OpenAI dashboard — OpenRouter does not proxy embeddings. " +
      "Once added, `npm run embed` will populate stoic_items.embedding for vector retrieval.",
    );
  }
  _client = new OpenAI({ apiKey: key });
  return _client;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const slice = texts.slice(i, i + BATCH_SIZE);
    const r = await client().embeddings.create({
      model: EMBED_MODEL,
      input: slice,
    });
    for (const d of r.data) out.push(d.embedding);
  }
  return out;
}

// === CLI ===
interface CliOpts {
  input?: string;
  output?: string;
  limit: number;
}

function parseArgs(): CliOpts {
  const argv = process.argv.slice(2);
  const opts: CliOpts = { limit: 500 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") opts.input = argv[++i];
    else if (a === "--output") opts.output = argv[++i];
    else if (a === "--limit") opts.limit = Number(argv[++i]);
  }
  return opts;
}

async function main() {
  const opts = parseArgs();

  // env presence preflight
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "✗ OPENAI_API_KEY missing from .env.local. Add it and re-run.\n" +
      "  (OpenRouter, which powers the chat agent, does NOT relay embedding requests —\n" +
      "  text-embedding-3-small must be reached directly via OpenAI.)",
    );
    process.exit(2);
  }

  // dry-run mode
  if (opts.input) {
    const buf = await fs.readFile(opts.input, "utf8");
    const arr = JSON.parse(buf) as StoicItemInsert[];
    const items = arr.slice(0, opts.limit);
    console.error(`→ dry-run: embedding ${items.length} items from ${opts.input}`);
    const vectors = await embedTexts(items.map((i) => i.text));
    if (vectors.length !== items.length) {
      throw new Error(`embed count mismatch: ${vectors.length} vs ${items.length}`);
    }
    for (const v of vectors) {
      if (v.length !== EMBED_DIM) throw new Error(`unexpected embedding dim: ${v.length}`);
    }
    const merged = items.map((it, i) => ({ ...it, embedding: vectors[i] }));
    const target = opts.output ?? opts.input.replace(/\.json$/, "") + ".embedded.json";
    await fs.writeFile(target, JSON.stringify(merged, null, 2));
    console.error(`✓ wrote ${merged.length} items with ${EMBED_DIM}-dim embeddings → ${target}`);
    console.error(`  sample magnitude: ${Math.sqrt(vectors[0].reduce((s, x) => s + x * x, 0)).toFixed(3)}`);
    return;
  }

  // DB mode
  const ping = await pingSchema();
  if (!ping.schema_ready) {
    console.error(`✗ schema missing: ${ping.missing.join(", ")}`);
    console.error(`  apply supabase/migrations/0001_stoic_schema.sql first, or pass --input items.json for dry-run.`);
    process.exit(2);
  }
  const sb = adminClient();
  const { data, error } = await sb
    .from("stoic_items")
    .select("id, text")
    .is("embedding", null)
    .limit(opts.limit);
  if (error) throw error;
  if (!data || data.length === 0) {
    console.log("✓ nothing to embed.");
    return;
  }
  console.error(`→ embedding ${data.length} rows (limit=${opts.limit})…`);
  const texts = data.map((r) => r.text as string);
  const vectors = await embedTexts(texts);
  let updated = 0;
  for (let i = 0; i < data.length; i++) {
    const upd = await sb
      .from("stoic_items")
      .update({ embedding: vectors[i] as unknown as string })
      .eq("id", (data[i] as { id: string }).id)
      .select("id");
    if (!upd.error) updated += upd.data?.length ?? 0;
  }
  console.log(`✓ embedded ${updated}/${data.length} rows`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
