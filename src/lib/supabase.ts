import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let _public: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

export function supabasePublic(): SupabaseClient {
  if (_public) return _public;
  _public = createClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false },
  });
  return _public;
}

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  _admin = createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false },
  });
  return _admin;
}

export async function pingSupabase(): Promise<{ ok: boolean; ms: number; err?: string }> {
  const t0 = Date.now();
  try {
    const sb = supabasePublic();
    const { error } = await sb.from("stoics").select("slug").limit(1);
    if (error && !/relation .* does not exist/i.test(error.message)) {
      return { ok: false, ms: Date.now() - t0, err: error.message };
    }
    return { ok: true, ms: Date.now() - t0 };
  } catch (e: unknown) {
    return { ok: false, ms: Date.now() - t0, err: e instanceof Error ? e.message : String(e) };
  }
}
