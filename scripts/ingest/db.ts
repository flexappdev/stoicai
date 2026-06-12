// PBI-1.6 (foundation) — Supabase admin client for ingest scripts
//
// Uses SUPABASE_SERVICE_ROLE_KEY → bypasses RLS, allows insert/upsert/delete on
// stoic_items, media, daily_picks, fsb_items. DDL (CREATE TABLE etc.) is NOT
// available via this client — apply supabase/migrations/0001_stoic_schema.sql
// via Studio SQL editor or the Management API PAT first.
//
// Dotenv: scripts run via tsx aren't inside Next.js, so .env.local is not
// auto-loaded — we load it here.

import { config as dotenvConfig } from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import path from "node:path";

dotenvConfig({ path: path.resolve(process.cwd(), ".env.local") });

export type StoicItemType =
  | "quote" | "passage" | "concept" | "exercise" | "anecdote"
  | "letter" | "meditation" | "maxim" | "dichotomy" | "objection_response";

export interface StoicItemInsert {
  type?: StoicItemType;
  text: string;
  text_modern?: string | null;
  author_slug?: string | null;
  work_slug?: string | null;
  source_ref?: string | null;
  translation?: string | null;
  themes?: string[];
  virtue?: "wisdom" | "courage" | "justice" | "temperance" | null;
  difficulty?: "intro" | "intermediate" | "deep";
  use_contexts?: string[];
  quality_score?: number;
  verified?: boolean;
  stoic_adjacent?: boolean;
}

let _admin: SupabaseClient | null = null;
export function adminClient(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  }
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

export interface SchemaPing {
  schema_ready: boolean;
  table_counts: Record<string, number | null>;
  missing: string[];
}

const EXPECTED = ["stoics", "works", "themes", "stoic_items", "media", "daily_picks", "fsb_items"];

export async function pingSchema(): Promise<SchemaPing> {
  const sb = adminClient();
  const counts: Record<string, number | null> = {};
  const missing: string[] = [];
  for (const t of EXPECTED) {
    // HEAD requests don't always surface PGRST205 (missing-table) errors via
    // the supabase-js wrapper. Use a GET with limit 0 instead — it forces
    // PostgREST to actually resolve the table in its schema cache.
    const { error, count } = await sb
      .from(t)
      .select("slug", { count: "exact" })
      .limit(0);
    const msg = error?.message ?? "";
    if (error && /Could not find the table|relation .* does not exist/i.test(msg)) {
      counts[t] = null;
      missing.push(t);
    } else if (error) {
      // Some tables (stoic_items, media, daily_picks, fsb_items) don't have
      // a 'slug' column — fall back to id selection.
      const r2 = await sb.from(t).select("id", { count: "exact" }).limit(0);
      if (r2.error && /Could not find the table|relation .* does not exist/i.test(r2.error.message ?? "")) {
        counts[t] = null;
        missing.push(t);
      } else if (r2.error) {
        counts[t] = null;
      } else {
        counts[t] = r2.count ?? 0;
      }
    } else {
      counts[t] = count ?? 0;
    }
  }
  return { schema_ready: missing.length === 0, table_counts: counts, missing };
}

export async function upsertItems(
  items: StoicItemInsert[],
  opts: { batchSize?: number; dryRun?: boolean } = {},
): Promise<{ inserted: number; batches: number; dryRun: boolean }> {
  const dryRun = !!opts.dryRun;
  const batchSize = opts.batchSize ?? 200;
  if (dryRun) {
    return { inserted: items.length, batches: Math.ceil(items.length / batchSize), dryRun: true };
  }
  const sb = adminClient();
  let inserted = 0;
  let batches = 0;
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const { error, count } = await sb
      .from("stoic_items")
      .insert(slice, { count: "exact" });
    if (error) throw new Error(`upsertItems batch ${batches}: ${error.message}`);
    inserted += count ?? slice.length;
    batches++;
  }
  return { inserted, batches, dryRun: false };
}

if (require.main === module) {
  pingSchema().then(
    (p) => {
      console.log("schema_ready:", p.schema_ready);
      console.log("table_counts:", p.table_counts);
      if (p.missing.length) console.log("missing tables:", p.missing.join(", "));
      process.exit(p.schema_ready ? 0 : 2);
    },
    (e) => {
      console.error("✗", e instanceof Error ? e.message : String(e));
      process.exit(1);
    },
  );
}
