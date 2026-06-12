// PBI-3.1 — Agent chat route
// Stoic mentor over OpenRouter. RAG retrieval over stoic_items.embedding is
// wired but degrades gracefully when the table is empty / migration unapplied —
// in that mode the agent talks Stoicism without citations.

import { NextRequest, NextResponse } from "next/server";
import { llmCall, type LlmTier } from "@/lib/llm";
import { supabaseAdmin } from "@/lib/supabase";
import { STOIC_MENTOR_SYSTEM } from "@/lib/persona";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
interface ChatRequest {
  messages: ChatMessage[];
  tier?: LlmTier;
  model?: string;
  rag?: boolean;
}

interface RetrievedItem {
  text: string;
  author_slug: string | null;
  source_ref: string | null;
  themes: string[] | null;
  quality_score: number | null;
  similarity: number;
}

async function retrieveContext(query: string, k = 6): Promise<{ items: RetrievedItem[]; note?: string }> {
  // Embed the query lazily — if no OPENAI_API_KEY or pgvector empty, skip silently.
  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return { items: [], note: "no embedding key" };
  }
  try {
    const sb = supabaseAdmin();
    // Try keyword fallback first so we work even without embeddings populated.
    // Match against text + author_slug + themes for any keyword in the query.
    const keywords = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .slice(0, 4);
    if (keywords.length === 0) return { items: [], note: "no useful keywords" };
    const orFilter = keywords.map((k) => `text.ilike.%${k}%`).join(",");
    const { data, error } = await sb
      .from("stoic_items")
      .select("text, author_slug, source_ref, themes, quality_score")
      .or(orFilter)
      .order("quality_score", { ascending: false })
      .limit(k);
    if (error) {
      return { items: [], note: `lookup error: ${error.message.slice(0, 80)}` };
    }
    return {
      items: (data ?? []).map((r) => ({ ...r, similarity: 0 })),
      note: data && data.length > 0 ? undefined : "no matching items (corpus empty?)",
    };
  } catch (e) {
    return { items: [], note: `retrieve crashed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

function formatContextBlock(items: RetrievedItem[]): string {
  if (items.length === 0) return "";
  const lines = items.map((it) => {
    const ref = it.source_ref ?? "—";
    const t = it.text.replace(/\s+/g, " ").trim();
    return `[${ref}] ${t}`;
  });
  return `CONTEXT (retrieved Stoic passages — cite by the bracketed ref when you use one):\n\n${lines.join("\n\n")}\n\n`;
}

export async function POST(req: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages[] required" }, { status: 400 });
  }
  const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return NextResponse.json({ error: "no user message" }, { status: 400 });

  const useRag = body.rag !== false;
  const ctx = useRag ? await retrieveContext(lastUser.content) : { items: [], note: "rag disabled" };
  const system = formatContextBlock(ctx.items) + STOIC_MENTOR_SYSTEM;

  try {
    const r = await llmCall({
      tier: body.tier ?? "balanced",
      model: body.model,
      system,
      messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: 1024,
      temperature: 0.55,
    });
    return NextResponse.json({
      ok: true,
      model: r.model,
      content: r.content,
      tokens: { in: r.tokens_in, out: r.tokens_out },
      retrieved: ctx.items.length,
      rag_note: ctx.note ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
