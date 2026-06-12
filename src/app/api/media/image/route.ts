// PBI-6.1 — POST /api/media/image
// On-demand image generation for a passage. Generates with Runware FLUX,
// mirrors the bytes to com27 S3 under stoicai/images/<item_id>.jpg,
// returns the public URL. Cached: if S3 already has the key, skip
// generation and return.
//
// Body: { item_id: string, text: string, author?: string, source_ref?: string, force?: boolean }
// Resp: { ok, image_url, runware_url, key, bytes, model, ms, cached }

import { NextRequest, NextResponse } from "next/server";
import { generateImageBuffer, brandCardPrompt } from "@/lib/runware";
import { uploadBuffer, s3Key } from "@/lib/s3";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  item_id?: string;
  text: string;
  author?: string;
  source_ref?: string;
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
  const key = s3Key(["images", `${itemId}.jpg`]);
  const s = env.s3();
  const publicUrl = `${s.publicBase.replace(/\/+$/, "")}/${key}`;

  // Cache check
  if (!body.force) {
    if (await s3Head(publicUrl)) {
      return NextResponse.json({
        ok: true,
        image_url: publicUrl,
        key,
        cached: true,
      });
    }
  }

  try {
    const prompt = brandCardPrompt(
      body.text,
      body.author ?? "a Stoic",
      body.source_ref ?? "—",
    );
    const { buffer, meta, runwareUrl } = await generateImageBuffer({ prompt });
    const up = await uploadBuffer({ key, body: buffer, contentType: "image/jpeg" });
    return NextResponse.json({
      ok: true,
      image_url: up.url,
      runware_url: runwareUrl,
      key: up.key,
      bytes: up.bytes,
      width: meta.width,
      height: meta.height,
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
  // Simple GET probe: ?item_id=... checks whether the image is already
  // generated. Useful for the UI to know whether the "Generate" button
  // should say "Generate" or "Regenerate".
  const url = new URL(req.url);
  const itemId = url.searchParams.get("item_id");
  if (!itemId) return NextResponse.json({ error: "item_id query param required" }, { status: 400 });
  const key = s3Key(["images", `${itemId}.jpg`]);
  const s = env.s3();
  const publicUrl = `${s.publicBase.replace(/\/+$/, "")}/${key}`;
  const exists = await s3Head(publicUrl);
  return NextResponse.json({ exists, image_url: exists ? publicUrl : null, key });
}
