import { env } from "./env";

export type LlmTier = "free" | "fast" | "balanced" | "premium";

const TIER_MODELS: Record<LlmTier, string[]> = {
  premium: ["anthropic/claude-sonnet-4-6", "openai/gpt-4o"],
  balanced: ["anthropic/claude-sonnet-4-6", "openai/gpt-4o-mini"],
  fast: ["openai/gpt-4o-mini", "anthropic/claude-haiku-4-5"],
  free: ["anthropic/claude-sonnet-4-6", "meta-llama/llama-3.3-70b-instruct:free", "google/gemma-2-9b-it:free"],
};

export interface LlmCallOpts {
  tier?: LlmTier;
  model?: string;
  system?: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  maxTokens?: number;
  temperature?: number;
}

export interface LlmResult {
  model: string;
  content: string;
  tokens_in?: number;
  tokens_out?: number;
}

export async function llmCall(opts: LlmCallOpts): Promise<LlmResult> {
  const key = env.openRouterApiKey();
  const tier = opts.tier ?? "balanced";
  const explicit = opts.model ? [opts.model] : null;
  const chain = explicit ?? TIER_MODELS[tier];

  const msgs = [
    ...(opts.system ? [{ role: "system" as const, content: opts.system }] : []),
    ...opts.messages,
  ];

  let lastErr: unknown = null;
  for (const model of chain) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://stoicai.vercel.app",
          "X-Title": "StoicAI",
        },
        body: JSON.stringify({
          model,
          messages: msgs,
          max_tokens: opts.maxTokens ?? 1024,
          temperature: opts.temperature ?? 0.6,
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        lastErr = new Error(`${model} → ${res.status}: ${txt.slice(0, 200)}`);
        if (res.status === 429 && model.includes(":free")) continue;
        if (res.status >= 500) continue;
        throw lastErr;
      }
      const data = await res.json();
      const choice = data?.choices?.[0]?.message?.content ?? "";
      return {
        model,
        content: typeof choice === "string" ? choice : JSON.stringify(choice),
        tokens_in: data?.usage?.prompt_tokens,
        tokens_out: data?.usage?.completion_tokens,
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`LLM chain exhausted: ${String(lastErr)}`);
}

export async function pingLlm(): Promise<{ ok: boolean; ms: number; err?: string }> {
  const t0 = Date.now();
  try {
    if (!process.env.OPENROUTER_API_KEY) return { ok: false, ms: 0, err: "OPENROUTER_API_KEY not set" };
    return { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, err: e instanceof Error ? e.message : String(e) };
  }
}
