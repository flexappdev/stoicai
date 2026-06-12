// PBI-1.1 — Gutenberg fetcher
// Pulls a public-domain Stoic text from Project Gutenberg, strips the
// Gutenberg header/footer license boilerplate, returns the body.
//
// Usage:
//   tsx scripts/ingest/gutenberg.ts <gutenberg_id>   # prints body to stdout
//   import { fetchGutenberg } from "./gutenberg"     # programmatic

const GUTENBERG_URLS = (id: string) => [
  `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
  `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
  `https://www.gutenberg.org/files/${id}/${id}.txt`,
];

const START_MARKERS = [
  /\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i,
  /\*\*\*START OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i,
];
const END_MARKERS = [
  /\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i,
  /\*\*\*END OF (THE|THIS) PROJECT GUTENBERG EBOOK[^*]*\*\*\*/i,
];

export interface GutenbergText {
  id: string;
  url: string;
  body: string;
  bytes: number;
  lines: number;
}

export async function fetchGutenberg(id: string): Promise<GutenbergText> {
  let lastErr: unknown = null;
  for (const url of GUTENBERG_URLS(id)) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "StoicAI/0.1 (research; flexappdev/stoicai)" },
      });
      if (!res.ok) {
        lastErr = new Error(`${url} → HTTP ${res.status}`);
        continue;
      }
      const raw = await res.text();
      return { id, url, ...stripGutenbergBoilerplate(raw) };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Gutenberg ${id} unreachable: ${String(lastErr)}`);
}

export function stripGutenbergBoilerplate(raw: string): { body: string; bytes: number; lines: number } {
  let body = raw.replace(/\r\n/g, "\n");
  for (const re of START_MARKERS) {
    const m = body.match(re);
    if (m) {
      const idx = body.indexOf(m[0]) + m[0].length;
      body = body.slice(idx);
      break;
    }
  }
  for (const re of END_MARKERS) {
    const m = body.match(re);
    if (m) {
      body = body.slice(0, body.indexOf(m[0]));
      break;
    }
  }
  body = body.replace(/^[\s\n]+/, "").replace(/[\s\n]+$/, "");
  return { body, bytes: body.length, lines: body.split("\n").length };
}

// Canonical Stoic Gutenberg IDs
export const STOIC_GUTENBERG = {
  meditations_long: "2680",        // Meditations, trans. George Long
  enchiridion_higginson: "45109",  // Enchiridion, trans. Higginson
  discourses_long: "10661",        // Discourses, trans. George Long
  letters_lucilius_v1: "56075",    // Seneca, Letters Vol I (Gummere)
  letters_lucilius_v2: "56076",    // Seneca, Letters Vol II
  letters_lucilius_v3: "56077",    // Seneca, Letters Vol III
  senecan_essays_basore: "60863",  // Seneca, Moral Essays (Stewart-adjacent)
  diogenes_lives: "57342",         // Diogenes Laertius, Lives (Hicks vol 2)
  cicero_tusculan: "14988",        // Tusculan Disputations
  cicero_de_officiis: "555",       // De Officiis (Walker trans.)
} as const;

if (require.main === module) {
  const id = process.argv[2];
  if (!id) {
    console.error("usage: tsx scripts/ingest/gutenberg.ts <gutenberg_id>");
    process.exit(2);
  }
  fetchGutenberg(id).then(
    (g) => {
      console.error(`✓ ${g.url} — ${g.bytes} bytes, ${g.lines} lines`);
      process.stdout.write(g.body);
    },
    (e) => {
      console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    },
  );
}
