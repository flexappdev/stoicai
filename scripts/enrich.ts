// PBI-2.1 — Claude enrichment batch
//
// For each StoicItemInsert without enrichment, ask the LLM (via OpenRouter)
// to fill in: themes (subset of taxonomy), virtue, difficulty, use_contexts,
// quality_score (0..100). Operates on JSON input (dry-run) or directly on
// Supabase stoic_items rows that have themes='{}' and quality_score=50.
//
// Usage:
//   tsx scripts/enrich.ts                                      # DB mode
//   tsx scripts/enrich.ts --input items.json [--output e.json] # dry-run
//   tsx scripts/enrich.ts --limit 50                           # cap batch
//
// Schema-aware: drops to dry-run output if stoic_items missing.

import fs from "node:fs/promises";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";
import { llmCall } from "../src/lib/llm";
import { adminClient, pingSchema, type StoicItemInsert } from "./ingest/db";

dotenvConfig({ path: path.resolve(process.cwd(), ".env.local") });

const THEMES = [
  "adversity", "death", "anger", "control", "virtue", "time",
  "wealth", "friendship", "fame", "anxiety", "discipline", "judgment",
] as const;
const VIRTUES = ["wisdom", "courage", "justice", "temperance"] as const;
const DIFFICULTIES = ["intro", "intermediate", "deep"] as const;
const CONTEXTS = ["morning", "evening", "crisis", "work", "loss", "conflict", "decision"] as const;

type Theme = typeof THEMES[number];
type Virtue = typeof VIRTUES[number];
type Difficulty = typeof DIFFICULTIES[number];
type Context = typeof CONTEXTS[number];

export interface Enrichment {
  themes: Theme[];
  virtue: Virtue | null;
  difficulty: Difficulty;
  use_contexts: Context[];
  quality_score: number;
}

const ENRICH_SYSTEM = `You are a Stoic philosophy librarian. For each item, return a strict JSON array (no prose) with one object per item in the same order, matching this exact shape:

{
  "themes": [string, ...],           // 0..3 from: ${THEMES.join(", ")}
  "virtue": string | null,           // one of: ${VIRTUES.join(", ")} or null if none clearly dominant
  "difficulty": string,              // exactly one of: ${DIFFICULTIES.join(", ")}
  "use_contexts": [string, ...],     // 0..3 from: ${CONTEXTS.join(", ")}
  "quality_score": number            // 0..100, integer. ≥85 = top-tier (memorable, citation-worthy). 50 = solid passage. ≤30 = transitional / list-of-relations / unmemorable boilerplate.
}

Rules:
- "themes" must be drawn ONLY from the allowed taxonomy; no synonyms, no plurals, no new tags.
- "virtue" picks the single dominant Stoic cardinal virtue if and only if it's clearly the item's subject; otherwise null.
- "difficulty" — intro = a beginner could read it cold; intermediate = needs Stoic background; deep = technical (physics, logic, pneuma, oikeiosis).
- "quality_score" — be honest: lists of names, ritual thanksgivings, and procedural notes score low. Memorable maxims, vivid metaphors, and tight aphorisms score high.
- Output PURE JSON. No markdown fences. No commentary. No preamble.`;

function buildBatchPrompt(items: StoicItemInsert[]): string {
  const lines = items.map(
    (it, i) =>
      `${i + 1}. [${it.source_ref ?? "—"}] (${it.author_slug ?? "—"})\n   ${it.text.slice(0, 600).replace(/\s+/g, " ")}`,
  );
  return `Enrich the following ${items.length} Stoic items. Return a JSON ARRAY of exactly ${items.length} objects in the SAME order.\n\n${lines.join("\n\n")}`;
}

// Lenient coercion: drop invalid themes/contexts (instead of failing the row);
// clamp quality_score; coerce difficulty/virtue to safe defaults if the model
// drifts. Returns null only when the row is structurally broken.
function coerceEnrichment(x: unknown): Enrichment | null {
  if (!x || typeof x !== "object") return null;
  const e = x as Record<string, unknown>;
  const themes = Array.isArray(e.themes)
    ? (e.themes.filter((t) => typeof t === "string" && (THEMES as readonly string[]).includes(t)) as Theme[])
    : [];
  const virtue =
    e.virtue === null
      ? null
      : typeof e.virtue === "string" && (VIRTUES as readonly string[]).includes(e.virtue)
        ? (e.virtue as Virtue)
        : null;
  const difficulty =
    typeof e.difficulty === "string" && (DIFFICULTIES as readonly string[]).includes(e.difficulty)
      ? (e.difficulty as Difficulty)
      : "intermediate";
  const use_contexts = Array.isArray(e.use_contexts)
    ? (e.use_contexts.filter((c) => typeof c === "string" && (CONTEXTS as readonly string[]).includes(c)) as Context[])
    : [];
  const raw = typeof e.quality_score === "number" ? e.quality_score : 50;
  const quality_score = Math.max(0, Math.min(100, Math.round(raw)));
  return { themes, virtue, difficulty, use_contexts, quality_score };
}

export async function enrichBatch(items: StoicItemInsert[]): Promise<Enrichment[]> {
  if (items.length === 0) return [];
  const r = await llmCall({
    tier: "balanced",
    system: ENRICH_SYSTEM,
    messages: [{ role: "user", content: buildBatchPrompt(items) }],
    maxTokens: Math.min(4096, 256 * items.length),
    temperature: 0.2,
  });
  // Strip possible markdown fences.
  const cleaned = r.content
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`enrichBatch: model returned non-JSON (${(e as Error).message.slice(0, 80)}) — first 200 chars: ${cleaned.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed) || parsed.length !== items.length) {
    throw new Error(`enrichBatch: expected array of ${items.length} got ${Array.isArray(parsed) ? parsed.length : typeof parsed}`);
  }
  const out: Enrichment[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const coerced = coerceEnrichment(parsed[i]);
    if (!coerced) {
      throw new Error(`enrichBatch: unrecoverable enrichment at index ${i}: ${JSON.stringify(parsed[i]).slice(0, 200)}`);
    }
    out.push(coerced);
  }
  return out;
}

// === CLI ===
interface CliOpts {
  input?: string;
  output?: string;
  limit: number;
  batchSize: number;
}

function parseArgs(): CliOpts {
  const argv = process.argv.slice(2);
  const opts: CliOpts = { limit: 50, batchSize: 10 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") opts.input = argv[++i];
    else if (a === "--output") opts.output = argv[++i];
    else if (a === "--limit") opts.limit = Number(argv[++i]);
    else if (a === "--batch") opts.batchSize = Number(argv[++i]);
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  const isDry = !!opts.input;

  let items: StoicItemInsert[];
  if (isDry) {
    const buf = await fs.readFile(opts.input!, "utf8");
    const arr = JSON.parse(buf);
    if (!Array.isArray(arr)) throw new Error(`--input file must contain a JSON array`);
    items = arr.slice(0, opts.limit) as StoicItemInsert[];
    console.error(`→ dry-run mode: ${items.length} items from ${opts.input} (cap=${opts.limit})`);
  } else {
    const ping = await pingSchema();
    if (!ping.schema_ready) {
      console.error(`✗ schema missing: ${ping.missing.join(", ")}`);
      console.error(`  apply supabase/migrations/0001_stoic_schema.sql first, or pass --input items.json for dry-run.`);
      process.exit(2);
    }
    const sb = adminClient();
    const { data, error } = await sb
      .from("stoic_items")
      .select("id, text, author_slug, source_ref")
      .eq("quality_score", 50)
      .or("themes.eq.{},themes.is.null")
      .limit(opts.limit);
    if (error) throw error;
    if (!data || data.length === 0) {
      console.log("✓ nothing to enrich.");
      return;
    }
    items = data as unknown as StoicItemInsert[];
    console.error(`→ DB mode: ${items.length} unenriched items`);
  }

  const enriched: { input: StoicItemInsert; e: Enrichment }[] = [];
  for (let i = 0; i < items.length; i += opts.batchSize) {
    const batch = items.slice(i, i + opts.batchSize);
    process.stderr.write(`  · batch ${Math.floor(i / opts.batchSize) + 1} (${batch.length} items)…`);
    try {
      const out = await enrichBatch(batch);
      enriched.push(...batch.map((b, j) => ({ input: b, e: out[j] })));
      process.stderr.write(` ✓\n`);
    } catch (e) {
      process.stderr.write(`\n    ✗ ${e instanceof Error ? e.message : String(e)}\n`);
    }
  }
  console.error(`✓ enriched ${enriched.length}/${items.length} items`);

  if (isDry) {
    const target = opts.output ?? opts.input!.replace(/\.json$/, "") + ".enriched.json";
    const merged = enriched.map((row) => ({ ...row.input, ...row.e }));
    await fs.writeFile(target, JSON.stringify(merged, null, 2));
    console.log(`→ wrote ${merged.length} enriched items to ${target}`);
    // Print 2 samples to stderr for quick eyeball
    for (const r of enriched.slice(0, 2)) {
      console.error(`  sample [${r.input.source_ref}]: themes=${r.e.themes.join(",")} virtue=${r.e.virtue ?? "-"} diff=${r.e.difficulty} q=${r.e.quality_score}`);
    }
    return;
  }

  const sb = adminClient();
  let updated = 0;
  for (const row of enriched) {
    const upd = await sb
      .from("stoic_items")
      .update({
        themes: row.e.themes,
        virtue: row.e.virtue,
        difficulty: row.e.difficulty,
        use_contexts: row.e.use_contexts,
        quality_score: row.e.quality_score,
      })
      .eq("source_ref", row.input.source_ref ?? "")
      .select("id");
    if (!upd.error) updated += upd.data?.length ?? 0;
  }
  console.log(`✓ updated ${updated} rows in stoic_items`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error("✗", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
