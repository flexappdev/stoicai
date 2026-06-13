// Wikisource REST API fetcher.
// Uses the v1 REST endpoint that returns rendered HTML for a page:
//   https://en.wikisource.org/api/rest_v1/page/html/<title>
// Caches to /tmp/stoicai-wikisource/ for 7 days. Rate-limits to ≤1 req/sec
// per the WMF user-agent policy.

import fs from "node:fs/promises";
import path from "node:path";

const CACHE_ROOT = process.env.STOICAI_WIKISOURCE_CACHE_DIR ?? "/tmp/stoicai-wikisource";
const UA = "StoicAI/0.1 (research; mat@matsiems.com; flexappdev/stoicai)";
const BASE = "https://en.wikisource.org/api/rest_v1/page/html";
const MIN_INTERVAL_MS = 1100;

let _last = 0;
async function rateLimit() {
  const since = Date.now() - _last;
  if (since < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - since));
  }
  _last = Date.now();
}

async function readCache(key: string): Promise<string | null> {
  try {
    const file = path.join(CACHE_ROOT, `${key}.html`);
    const stat = await fs.stat(file);
    if (Date.now() - stat.mtimeMs > 7 * 24 * 60 * 60 * 1000) return null;
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function writeCache(key: string, html: string): Promise<void> {
  try {
    await fs.mkdir(CACHE_ROOT, { recursive: true });
    await fs.writeFile(path.join(CACHE_ROOT, `${key}.html`), html, "utf8");
  } catch {
    // best-effort
  }
}

function safeKey(title: string): string {
  return title.replace(/[^a-zA-Z0-9_\-]/g, "_");
}

export async function fetchWikisourceHtml(title: string): Promise<string> {
  const key = safeKey(title);
  const cached = await readCache(key);
  if (cached) return cached;

  await rateLimit();
  const url = `${BASE}/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) throw new Error(`Wikisource ${title}: HTTP ${res.status}`);
  const html = await res.text();
  await writeCache(key, html);
  return html;
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&lsquo;": "‘",
  "&rsquo;": "’",
};

function decodeEntities(s: string): string {
  let out = s;
  for (const [k, v] of Object.entries(HTML_ENTITIES)) out = out.split(k).join(v);
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
  return out;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Extract main-body paragraphs from a Wikisource page. Strips <style> +
// <script> blocks first (the REST API output embeds 6+ inline CSS blocks
// for verse formatting and they pollute the <p> match). Filters:
//  - paragraphs < 60 chars
//  - paragraphs that look like CSS (start with .mw-…{)
//  - paragraphs that are headers / nav (all-caps, single line)
export function extractParagraphs(html: string): string[] {
  // Strip noise BEFORE pattern matching.
  const cleanHtml = html
    .replace(/<style\b[\s\S]*?<\/style>/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/g, "");

  const paragraphs: string[] = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleanHtml))) {
    const inner = m[1];
    const cleaned = inner
      .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/g, "")
      .replace(/<span\s+class="mw-editsection"[\s\S]*?<\/span>/g, "");
    const txt = decodeEntities(stripTags(cleaned));
    if (txt.length < 60) continue;
    if (/^\s*\.(mw|wst)-[a-z-]+/i.test(txt)) continue;        // CSS leak
    if (/^[A-Z\s\d.,'"\-–—:]+$/.test(txt) && txt.length < 200) continue;  // all-caps heading
    paragraphs.push(txt);
  }
  return paragraphs;
}
