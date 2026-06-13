// Runware Seedance video generation (model: bytedance:2@2).
//
// 5-second 720×1280 (9:16) clips. Async via Runware's videoInference
// task — taskUUID returns immediately, status polls until a video URL
// is available. Cost: roughly $0.20–$0.30 per clip. Use sparingly;
// /api/media/video gates on item_id and an explicit cache check.

import { env } from "./env";

const VIDEO_MODEL = "bytedance:2@2"; // Seedance
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 120000;

export interface VideoGenInput {
  prompt: string;
  width?: number;
  height?: number;
  duration?: number; // seconds, 5 default
  seed?: number;
}

export interface VideoGenResult {
  url: string;
  bytes: number;
  width: number;
  height: number;
  duration: number;
  model: string;
  ms: number;
}

interface RunwareTaskResp {
  data?: {
    taskUUID?: string;
    videoURL?: string;
    status?: string;
    cost?: number;
  }[];
  errors?: { message: string }[];
}

async function postRunware(payload: object): Promise<RunwareTaskResp> {
  const r = env.runware();
  if (!r.key) throw new Error("RUNWARE_API_KEY missing");
  const base = r.base || "https://api.runware.ai/v1";
  const res = await fetch(base, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${r.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Runware HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as RunwareTaskResp;
}

export async function generateVideo(input: VideoGenInput): Promise<VideoGenResult> {
  const width = input.width ?? 720;
  const height = input.height ?? 1280;
  const duration = input.duration ?? 5;

  const t0 = Date.now();
  const submit = await postRunware([
    {
      taskType: "videoInference",
      taskUUID: crypto.randomUUID(),
      model: VIDEO_MODEL,
      positivePrompt: input.prompt,
      width,
      height,
      duration,
      numberResults: 1,
      outputFormat: "MP4",
      outputType: "URL",
      ...(input.seed ? { seed: input.seed } : {}),
    },
  ]);
  if (submit.errors?.length) throw new Error(`Runware: ${submit.errors[0].message}`);
  const first = submit.data?.[0];
  if (!first) throw new Error(`Runware video: empty response`);

  // Some Runware video tasks return the URL on the same call; others
  // require polling. Handle both.
  let videoUrl = first.videoURL ?? "";
  const taskUUID = first.taskUUID;

  if (!videoUrl && taskUUID) {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const status = await postRunware([
        { taskType: "getResponse", taskUUID },
      ]);
      const got = status.data?.[0];
      if (got?.videoURL) {
        videoUrl = got.videoURL;
        break;
      }
      if (got?.status && /(failed|error)/i.test(got.status)) {
        throw new Error(`Runware video task failed: ${got.status}`);
      }
    }
    if (!videoUrl) throw new Error(`Runware video polling timed out after ${POLL_TIMEOUT_MS}ms`);
  }

  const imgRes = await fetch(videoUrl);
  if (!imgRes.ok) throw new Error(`Runware CDN fetch failed: ${imgRes.status}`);
  const bytes = (await imgRes.arrayBuffer()).byteLength;

  return {
    url: videoUrl,
    bytes,
    width,
    height,
    duration,
    model: VIDEO_MODEL,
    ms: Date.now() - t0,
  };
}

export async function generateVideoBuffer(input: VideoGenInput): Promise<{
  buffer: Buffer;
  meta: Omit<VideoGenResult, "url">;
  runwareUrl: string;
}> {
  const gen = await generateVideo(input);
  const res = await fetch(gen.url);
  if (!res.ok) throw new Error(`Runware CDN fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    buffer: buf,
    meta: {
      bytes: buf.length, width: gen.width, height: gen.height,
      duration: gen.duration, model: gen.model, ms: gen.ms,
    },
    runwareUrl: gen.url,
  };
}

export function ambientVideoPrompt(text: string, author: string): string {
  // Seedance does best with concrete, motion-rich prompts. Aim for
  // ambient/atmospheric over literal. Avoid talking heads.
  const seed = text.split(" ").slice(0, 10).join(" ");
  return [
    "Slow cinematic pan across",
    "classical Roman marble bust on a dark velvet background",
    "candle light flickering, dust particles drifting in shafts of light",
    "deep cyan (#006699) cool tone, parchment warm rim light",
    "9:16 vertical, contemplative pace, no text or captions",
    `mood: ${seed}`,
    `(attributed to ${author})`,
  ].join(", ");
}
