// Runware client — image generation only (1024×1024 FLUX schnell).
//
// IMPORTANT: RUNWARE_DEFAULT_MODEL in the shared central env is
// `bytedance:2@2` (Seedance video). Do NOT use it for image inference —
// hard-pin `runware:100@1` (FLUX schnell) instead. Reference: shared
// memory note "Runware default model is video".

import { env } from "./env";

const IMAGE_MODEL = "runware:100@1";

export interface ImageGenInput {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
}

export interface ImageGenResult {
  url: string;       // CDN URL where Runware hosts the result
  bytes: number;
  width: number;
  height: number;
  model: string;
  ms: number;
}

interface RunwareResponse {
  data?: {
    imageURL?: string;
    imageBase64Data?: string;
    cost?: number;
    taskUUID?: string;
  }[];
  errors?: { message: string }[];
}

export async function generateImage(input: ImageGenInput): Promise<ImageGenResult> {
  const r = env.runware();
  if (!r.key) throw new Error("RUNWARE_API_KEY missing");
  const base = r.base || "https://api.runware.ai/v1";

  const width = input.width ?? 1024;
  const height = input.height ?? 1024;

  const t0 = Date.now();
  const res = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${r.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        model: IMAGE_MODEL,
        positivePrompt: input.prompt,
        width,
        height,
        steps: input.steps ?? 4,
        CFGScale: input.cfg ?? 1.5,
        numberResults: 1,
        outputFormat: "JPEG",
        outputType: "URL",
        ...(input.seed ? { seed: input.seed } : {}),
      },
    ]),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Runware HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as RunwareResponse;
  if (data.errors?.length) {
    throw new Error(`Runware error: ${data.errors[0].message}`);
  }
  const first = data.data?.[0];
  if (!first?.imageURL) {
    throw new Error(`Runware returned no image URL: ${JSON.stringify(data).slice(0, 200)}`);
  }
  // Fetch the image bytes to know size; Runware's CDN URL is the
  // primary public URL until we mirror to com27.
  const imgRes = await fetch(first.imageURL);
  if (!imgRes.ok) throw new Error(`Runware CDN fetch failed: ${imgRes.status}`);
  const bytes = (await imgRes.arrayBuffer()).byteLength;

  return {
    url: first.imageURL,
    bytes,
    width,
    height,
    model: IMAGE_MODEL,
    ms: Date.now() - t0,
  };
}

export async function generateImageBuffer(input: ImageGenInput): Promise<{
  buffer: Buffer;
  meta: Omit<ImageGenResult, "url">;
  runwareUrl: string;
}> {
  const gen = await generateImage(input);
  const imgRes = await fetch(gen.url);
  if (!imgRes.ok) throw new Error(`Runware CDN fetch failed: ${imgRes.status}`);
  const buf = Buffer.from(await imgRes.arrayBuffer());
  return {
    buffer: buf,
    meta: { bytes: buf.length, width: gen.width, height: gen.height, model: gen.model, ms: gen.ms },
    runwareUrl: gen.url,
  };
}

export function brandCardPrompt(text: string, author: string, source_ref: string): string {
  // Brand: classical, parchment, restrained palette, no text rendering
  // (text rendering by FLUX is notoriously bad — we overlay text later
  // via Remotion / CSS for the actual card asset).
  const seed = text.split(" ").slice(0, 12).join(" ");
  return [
    "Stoic-philosophy editorial illustration",
    "classical Roman aesthetic, parchment-and-ink palette",
    "deep cyan (#006699) brand accent",
    "minimal, austere, restrained, contemplative",
    "marble statuary, olive branches, distant Mediterranean light",
    "no text, no letters, no captions, no signage",
    `mood: ${seed}`,
    `attributed to ${author}`,
    `(reference: ${source_ref})`,
  ].join(", ");
}
