// Text-to-speech via OpenAI TTS-1.
// Voices: alloy, echo, fable, onyx, nova, shimmer. "onyx" is closest to
// a Senecan-mentor register for our default; "echo" works for a younger
// Marcus voice. Output MP3.

import OpenAI from "openai";
import { env } from "./env";

const MODEL = "tts-1";
type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
const DEFAULT_VOICE: Voice = "onyx";

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (_client) return _client;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY not set in .env.local. TTS-1 needs direct OpenAI access — OpenRouter doesn't proxy /audio/speech.",
    );
  }
  _client = new OpenAI({ apiKey: key });
  return _client;
}

export interface TTSInput {
  text: string;
  voice?: Voice;
  speed?: number; // 0.25..4.0
}

export interface TTSResult {
  buffer: Buffer;
  bytes: number;
  voice: Voice;
  model: string;
  ms: number;
  est_duration_s: number;
}

const WORDS_PER_SECOND = 2.4;
function estimateDuration(text: string, speed: number): number {
  const words = text.trim().split(/\s+/).length;
  return Math.round((words / WORDS_PER_SECOND) / speed);
}

export async function generateTTS(input: TTSInput): Promise<TTSResult> {
  if (!input.text || input.text.trim().length === 0) throw new Error("text required");
  // OpenAI TTS hard cap is 4096 chars; chunk anything larger.
  if (input.text.length > 4000) {
    throw new Error(`text too long for single-call TTS (${input.text.length} chars > 4000). Chunk first.`);
  }
  const voice = input.voice ?? DEFAULT_VOICE;
  const speed = input.speed ?? 1.0;
  const t0 = Date.now();
  const r = await client().audio.speech.create({
    model: MODEL,
    voice,
    input: input.text,
    speed,
    response_format: "mp3",
  });
  const buf = Buffer.from(await r.arrayBuffer());
  return {
    buffer: buf,
    bytes: buf.length,
    voice,
    model: MODEL,
    ms: Date.now() - t0,
    est_duration_s: estimateDuration(input.text, speed),
  };
}

export function isTTSReady(): boolean {
  void env;
  return !!process.env.OPENAI_API_KEY;
}
