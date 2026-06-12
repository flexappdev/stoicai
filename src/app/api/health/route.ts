import { NextResponse } from "next/server";
import { pingSupabase } from "@/lib/supabase";
import { pingLlm } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env_present = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    MONGODB_URI: !!process.env.MONGODB_URI,
    S3_BUCKET_NAME: !!process.env.S3_BUCKET_NAME,
    NEXT_PUBLIC_GA_ID: !!process.env.NEXT_PUBLIC_GA_ID,
  };
  const [supa, llm] = await Promise.all([pingSupabase(), pingLlm()]);
  return NextResponse.json({
    ok: true,
    app: "stoicai",
    version: "0.1.0",
    phase: 0,
    port: Number(process.env.NEXT_PUBLIC_APP_PORT ?? 17003),
    env_present,
    supabase: supa,
    llm,
    ts: new Date().toISOString(),
  });
}
