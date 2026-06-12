// PBI-6.2 — POST /api/media/audio
// On-demand TTS for a passage. OpenAI TTS-1 (onyx voice by default),
// uploaded to com27 S3 at stoicai/audio/<item_id>.mp3. Mirrors the
// image route's contract (POST to generate, GET to probe, cache via
// S3 HEAD, ?force=true to regenerate).

import { NextRequest, NextResponse } from "next/server";
import { generateTTS, isTTSReady } from "@/lib/tts";
import { uploadBuffer, s3Key } from "@/lib/s3";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  item_id?: string;
  text: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed?: number;
  force?: boolean;
}

async function s3Head(publicUrl: string): Promise<boolean> {
  try {
    const r = await fetch(publicUrl, { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  if (!isTTSReady()) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY not set — TTS-1 needs direct OpenAI access. Add it to .env.local and re-deploy. Until then, /api/media/audio surfaces this same message.",
      },
      { status: 503 },
    );
  }

  const itemId = body.item_id ?? "ad-hoc";
  const key = s3Key(["audio", `${itemId}.mp3`]);
  const s = env.s3();
  const publicUrl = `${s.publicBase.replace(/\/+$/, "")}/${key}`;

  if (!body.force && (await s3Head(publicUrl))) {
    return NextResponse.json({ ok: true, audio_url: publicUrl, key, cached: true });
  }

  try {
    const r = await generateTTS({ text: body.text, voice: body.voice, speed: body.speed });
    const up = await uploadBuffer({ key, body: r.buffer, contentType: "audio/mpeg" });
    return NextResponse.json({
      ok: true,
      audio_url: up.url,
      key: up.key,
      bytes: up.bytes,
      voice: r.voice,
      model: r.model,
      ms: r.ms,
      est_duration_s: r.est_duration_s,
      cached: false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const itemId = url.searchParams.get("item_id");
  if (!itemId) return NextResponse.json({ error: "item_id query param required" }, { status: 400 });
  const key = s3Key(["audio", `${itemId}.mp3`]);
  const s = env.s3();
  const publicUrl = `${s.publicBase.replace(/\/+$/, "")}/${key}`;
  const exists = await s3Head(publicUrl);
  return NextResponse.json({
    exists,
    audio_url: exists ? publicUrl : null,
    key,
    tts_ready: isTTSReady(),
  });
}
