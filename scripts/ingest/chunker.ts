// PBI-1.2 — Passage-aware chunker
// Splits a Gutenberg body into argument-unit chunks. Recognises:
//  - Numbered passages: "1.", "II.", "5.", "37." (Meditations, Letters)
//  - Roman-numeral chapters (Enchiridion)
//  - "LETTER N." / "EPISTLE N." headers (Senecan corpus)
//  - "DISCOURSE N." / "BOOK N." headers (Epictetus)
// Falls back to paragraph splitting (>= 1 blank line) when nothing else matches.

export interface RawChunk {
  ref: string;         // e.g. "1.7" or "Letter 13.4" — caller picks the format
  text: string;
  index: number;
}

export interface ChunkerOpts {
  mode: "meditations" | "enchiridion" | "letters" | "discourses" | "paragraphs";
  bookSlug?: string;
  refPrefix?: string;
  minLen?: number;
  maxLen?: number;
}

const DEFAULT_MIN = 60;
const DEFAULT_MAX = 1800;

export function chunk(body: string, opts: ChunkerOpts): RawChunk[] {
  const minLen = opts.minLen ?? DEFAULT_MIN;
  const maxLen = opts.maxLen ?? DEFAULT_MAX;
  let raw: { ref: string; text: string }[];
  switch (opts.mode) {
    case "meditations":
      raw = splitMeditations(body);
      break;
    case "enchiridion":
      raw = splitEnchiridion(body);
      break;
    case "letters":
      raw = splitLetters(body);
      break;
    case "discourses":
      raw = splitDiscourses(body);
      break;
    case "paragraphs":
    default:
      raw = splitParagraphs(body, opts.refPrefix ?? "p");
      break;
  }
  const cleaned: RawChunk[] = [];
  raw.forEach((r, i) => {
    const t = normalize(r.text);
    if (t.length < minLen) return;
    if (t.length <= maxLen) {
      cleaned.push({ ref: r.ref, text: t, index: cleaned.length });
      return;
    }
    splitLong(t, maxLen).forEach((sub, j) => {
      cleaned.push({
        ref: `${r.ref}.${j + 1}`,
        text: sub,
        index: cleaned.length,
      });
    });
  });
  return cleaned;
}

function normalize(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/—/g, "—")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}

function splitLong(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [text];
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + s).length > maxLen && buf) {
      out.push(buf.trim());
      buf = "";
    }
    buf += s;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

// === Meditations: "THE FIRST BOOK"/"BOOK N" then "I.", "II." or "1.", "2." passages ===
const ORDINAL_WORDS: Record<string, number> = {
  FIRST: 1, SECOND: 2, THIRD: 3, FOURTH: 4, FIFTH: 5, SIXTH: 6,
  SEVENTH: 7, EIGHTH: 8, NINTH: 9, TENTH: 10, ELEVENTH: 11, TWELFTH: 12,
};

function splitMeditations(body: string): { ref: string; text: string }[] {
  const out: { ref: string; text: string }[] = [];
  // Long translation uses "THE FIRST BOOK", "HIS FIRST BOOK", etc. Body content
  // starts at "THE FIRST BOOK" (after a preface that often contains "HIS FIRST BOOK").
  const bookRe = /(?:^|\n)\s*(?:THE|HIS)\s+(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH)\s+BOOK\b/gi;
  type Hit = { num: number; start: number };
  const books: Hit[] = [];
  let m: RegExpExecArray | null;
  while ((m = bookRe.exec(body))) {
    const n = ORDINAL_WORDS[m[1].toUpperCase()];
    if (n) books.push({ num: n, start: m.index + m[0].length });
  }
  // Fallback to "BOOK I" / "BOOK 1" style
  if (books.length === 0) {
    const altRe = /(?:^|\n)\s*BOOK\s+([IVXLCM]+|\d+)\b/gi;
    while ((m = altRe.exec(body))) {
      books.push({ num: romanToInt(m[1]), start: m.index + m[0].length });
    }
  }
  // Keep only the last occurrence of each book number — early matches are usually
  // a table of contents repeated before the body.
  const lastByNum = new Map<number, number>();
  for (const b of books) lastByNum.set(b.num, b.start);
  const finalBooks: Hit[] = Array.from(lastByNum.entries())
    .map(([num, start]) => ({ num, start }))
    .sort((a, b) => a.start - b.start);

  if (finalBooks.length === 0) {
    return splitNumberedPassages(body, "");
  }
  for (let i = 0; i < finalBooks.length; i++) {
    const start = finalBooks[i].start;
    const end = i + 1 < finalBooks.length ? finalBooks[i + 1].start : body.length;
    const slice = body.slice(start, end);
    const passages = splitNumberedPassages(slice, `${finalBooks[i].num}`);
    out.push(...passages);
  }
  return out;
}

function splitNumberedPassages(body: string, bookRef: string): { ref: string; text: string }[] {
  const out: { ref: string; text: string }[] = [];
  // Match either Roman numerals (I. II. III.) or Arabic (1. 2. 3.) at line starts.
  const re = /(?:^|\n)\s*([IVXLCM]{1,6}|\d{1,3})\.\s+/g;
  const hits: { n: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    hits.push({ n: m[1], start: m.index + m[0].length });
  }
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].start;
    const end = i + 1 < hits.length ? hits[i + 1].start - 4 : body.length;
    const text = body.slice(start, end);
    const num = romanToInt(hits[i].n);
    const ref = bookRef ? `${bookRef}.${num}` : `${num}`;
    out.push({ ref, text });
  }
  return out;
}

// === Enchiridion: numbered chapters (often "1.", "II.") ===
function splitEnchiridion(body: string): { ref: string; text: string }[] {
  const out: { ref: string; text: string }[] = [];
  const re = /(?:^|\n)\s*(?:CHAPTER\s+)?([IVXLCM]+|\d{1,3})\.?\s+/g;
  const hits: { n: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    hits.push({ n: m[1], start: m.index + m[0].length });
  }
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].start;
    const end = i + 1 < hits.length ? hits[i + 1].start - 2 : body.length;
    out.push({ ref: `${romanToInt(hits[i].n)}`, text: body.slice(start, end) });
  }
  return out;
}

// === Letters to Lucilius: "LETTER N." or "EPISTLE N." headers ===
function splitLetters(body: string): { ref: string; text: string }[] {
  const out: { ref: string; text: string }[] = [];
  const re = /(?:^|\n)\s*(?:LETTER|EPISTLE)\s+([IVXLCM]+|\d{1,3})\.?/gi;
  const hits: { n: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    hits.push({ n: m[1], start: m.index + m[0].length });
  }
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].start;
    const end = i + 1 < hits.length ? hits[i + 1].start - 6 : body.length;
    out.push({ ref: `Letter ${romanToInt(hits[i].n)}`, text: body.slice(start, end) });
  }
  return out;
}

// === Discourses: "BOOK N" + "CHAPTER N" hierarchy ===
function splitDiscourses(body: string): { ref: string; text: string }[] {
  const out: { ref: string; text: string }[] = [];
  const bookRe = /(?:^|\n)\s*BOOK\s+([IVXLCM]+|\d+)/gi;
  const books: { num: number; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = bookRe.exec(body))) {
    books.push({ num: romanToInt(m[1]), start: m.index + m[0].length });
  }
  if (books.length === 0) {
    return splitChapters(body, "Discourses");
  }
  for (let i = 0; i < books.length; i++) {
    const start = books[i].start;
    const end = i + 1 < books.length ? books[i + 1].start : body.length;
    const slice = body.slice(start, end);
    const chapters = splitChapters(slice, `${books[i].num}`);
    out.push(...chapters);
  }
  return out;
}

function splitChapters(body: string, bookRef: string): { ref: string; text: string }[] {
  const out: { ref: string; text: string }[] = [];
  const re = /(?:^|\n)\s*CHAPTER\s+([IVXLCM]+|\d{1,3})\.?/gi;
  const hits: { n: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    hits.push({ n: m[1], start: m.index + m[0].length });
  }
  if (hits.length === 0) return splitParagraphs(body, bookRef);
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].start;
    const end = i + 1 < hits.length ? hits[i + 1].start - 7 : body.length;
    out.push({ ref: `${bookRef}.${romanToInt(hits[i].n)}`, text: body.slice(start, end) });
  }
  return out;
}

// === Paragraph fallback ===
function splitParagraphs(body: string, refPrefix: string): { ref: string; text: string }[] {
  return body
    .split(/\n\s*\n+/)
    .map((p, i) => ({ ref: `${refPrefix}.${i + 1}`, text: p }))
    .filter((c) => c.text.trim().length > 0);
}

function romanToInt(s: string): number {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, M: 1000 };
  let result = 0;
  const u = s.toUpperCase();
  for (let i = 0; i < u.length; i++) {
    const a = map[u[i]] ?? 0;
    const b = map[u[i + 1]] ?? 0;
    result += a < b ? -a : a;
  }
  return result;
}

if (require.main === module) {
  const mode = (process.argv[2] ?? "meditations") as ChunkerOpts["mode"];
  let buf = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (d) => (buf += d));
  process.stdin.on("end", () => {
    const chunks = chunk(buf, { mode });
    console.error(`✓ ${chunks.length} chunks (mode=${mode})`);
    for (const c of chunks.slice(0, 5)) {
      console.error(`  [${c.ref}] ${c.text.slice(0, 80).replace(/\s+/g, " ")}…`);
    }
    process.stdout.write(JSON.stringify(chunks, null, 2));
  });
}
