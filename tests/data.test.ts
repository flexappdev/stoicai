import { describe, it, expect } from "vitest";
import { STOICS, WORKS, getStoic, worksByAuthor, formatYears } from "../src/lib/stoics-data";
import { CONCEPTS, TRACKS, getConcept } from "../src/lib/concepts-data";
import { WISDOM, ALL_THEMES, ALL_VIRTUES, dailyPick } from "../src/lib/wisdom-data";

describe("stoics-data", () => {
  it("has exactly 8 Stoics in chronological order", () => {
    expect(STOICS.length).toBe(8);
    for (let i = 1; i < STOICS.length; i++) {
      expect(STOICS[i].birth_year).toBeGreaterThanOrEqual(STOICS[i - 1].birth_year);
    }
  });
  it("all 8 are unique-slugged and findable", () => {
    const slugs = new Set(STOICS.map((s) => s.slug));
    expect(slugs.size).toBe(8);
    for (const s of STOICS) expect(getStoic(s.slug)).toEqual(s);
  });
  it("works' author_slug values all resolve", () => {
    for (const w of WORKS) {
      if (w.author_slug !== null) {
        expect(getStoic(w.author_slug)).toBeTruthy();
      }
    }
  });
  it("worksByAuthor(seneca) returns letters + essays", () => {
    const ws = worksByAuthor("seneca");
    expect(ws.length).toBeGreaterThanOrEqual(2);
  });
  it("formatYears handles BCE / CE boundary", () => {
    expect(formatYears(-334, -262)).toBe("334 BCE – 262 BCE");
    expect(formatYears(-4, 65)).toBe("4 BCE – 65 CE");
    expect(formatYears(121, 180)).toBe("121 CE – 180 CE");
  });
});

describe("concepts-data", () => {
  it("has 12 concepts spread across 3 tracks", () => {
    expect(CONCEPTS.length).toBe(12);
    expect(TRACKS.length).toBe(3);
    const counts = TRACKS.map((t) => t.concepts().length);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(12);
  });
  it("see_also references all resolve", () => {
    for (const c of CONCEPTS) {
      for (const ref of c.see_also ?? []) {
        expect(getConcept(ref), `dangling see_also: ${c.slug} → ${ref}`).toBeTruthy();
      }
    }
  });
  it("associated_stoics references all resolve", () => {
    for (const c of CONCEPTS) {
      for (const stoic of c.associated_stoics ?? []) {
        expect(STOICS.find((s) => s.slug === stoic), `dangling stoic: ${c.slug} → ${stoic}`).toBeTruthy();
      }
    }
  });
});

describe("wisdom-data", () => {
  it("has 30+ curated passages", () => {
    expect(WISDOM.length).toBeGreaterThanOrEqual(30);
  });
  it("all author_slugs resolve to a Stoic", () => {
    for (const w of WISDOM) {
      expect(getStoic(w.author_slug), `${w.id} → ${w.author_slug}`).toBeTruthy();
    }
  });
  it("themes are drawn from the master taxonomy", () => {
    const taxonomy = new Set(ALL_THEMES);
    for (const w of WISDOM) {
      for (const t of w.themes) {
        expect(taxonomy.has(t), `${w.id} uses theme not in master list: ${t}`).toBe(true);
      }
    }
  });
  it("virtues are one of the four cardinals or null", () => {
    const allowed = new Set([...ALL_VIRTUES, null]);
    for (const w of WISDOM) {
      expect(allowed.has(w.virtue), `${w.id} virtue=${w.virtue}`).toBe(true);
    }
  });
  it("dailyPick is deterministic per UTC date", () => {
    const d = new Date(Date.UTC(2026, 5, 13)); // 2026-06-13
    const a = dailyPick(d);
    const b = dailyPick(d);
    expect(a.id).toBe(b.id);
  });
});
