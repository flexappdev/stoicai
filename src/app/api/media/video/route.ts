// PBI-6.3 — POST /api/media/video
// On-demand short-form video generation via Runware Seedance (bytedance:2@2)
// for a passage. Caches to com27 S3 at stoicai/videos/<item_id>.mp4.
//
// Heavy: 30–60s per generation, ~$0.20–0.30 per clip. Requires explicit
// `confirm=true` in the request body to spend, so accidental hits don't
// auto-bill. Cached responses still return without confirmation.

import { NextRequest, NextResponse } from "next/server";
import { generateVideoBuffer, ambientVideoPrompt } from "@/lib/video";
import { uploadBuffer, s3Key } from "@/lib/s3";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface Body {
  item_id?: string;
  text: string;
  author?: string;
  source_ref?: string;
  confirm?: boolean;
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

  const itemId = body.item_id ?? "ad-hoc";
  const key = s3Key(["videos", `${itemId}.mp4`]);
  const s = env.s3();
  const publicUrl = `${s.publicBase.replace(/\/+$/, "")}/${key}`;

  // Cache short-circuit always allowed.
  if (!body.force && (await s3Head(publicUrl))) {
    return NextResponse.json({ ok: true, video_url: publicUrl, key, cached: true });
  }

  // Spend gate.
  if (!body.confirm) {
    return NextResponse.json(
      {
        error:
          "video generation costs ~$0.20–$0.30 per clip and takes 30–60s. Pass { confirm: true } in the request body to proceed. (cached responses don't need confirmation.)",
        gated: true,
      },
      { status: 402 },
    );
  }

  try {
    const prompt = ambientVideoPrompt(body.text, body.author ?? "a Stoic");
    const { buffer, meta, runwareUrl } = await generateVideoBuffer({ prompt });
    const up = await uploadBuffer({ key, body: buffer, contentType: "video/mp4" });
    return NextResponse.json({
      ok: true,
      video_url: up.url,
      runware_url: runwareUrl,
      key: up.key,
      bytes: up.bytes,
      width: meta.width,
      height: meta.height,
      duration: meta.duration,
      model: meta.model,
      ms: meta.ms,
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
  const key = s3Key(["videos", `${itemId}.mp4`]);
  const s = env.s3();
  const publicUrl = `${s.publicBase.replace(/\/+$/, "")}/${key}`;
  const exists = await s3Head(publicUrl);
  return NextResponse.json({
    exists,
    video_url: exists ? publicUrl : null,
    key,
    runware_ready: !!process.env.RUNWARE_API_KEY,
  });
}
