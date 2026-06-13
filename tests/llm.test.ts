import { describe, it, expect } from "vitest";

// Don't import llm.ts (it makes live HTTP). Just verify the tier table is
// what the AIOS gotcha mandates: paid model FIRST in every chain (so a
// 429 from a free model never short-circuits before we try Sonnet).

const TIER_FILE = "src/lib/llm.ts";

describe("llm tier table", () => {
  it("paid claude-sonnet-4-6 leads every tier chain", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile(TIER_FILE, "utf8");
    const tableMatch = src.match(/const TIER_MODELS[\s\S]*?\}\s*;/);
    expect(tableMatch).toBeTruthy();
    const table = tableMatch![0];

    // For each tier row, the first array element must be a paid model
    // (anthropic/claude-* without :free, or openai/gpt-* without :free).
    const ROW = /(\w+):\s*\[(.*?)\]/g;
    let m;
    let rows = 0;
    while ((m = ROW.exec(table))) {
      rows++;
      const [, tier, models] = m;
      const first = models.split(",")[0].trim().replace(/['"]/g, "");
      expect(first).not.toMatch(/:free/);
      // tier-specific: free tier must lead with paid Sonnet to avoid
      // 429 cascade per AIOS gotcha.
      if (tier === "free") {
        expect(first).toBe("anthropic/claude-sonnet-4-6");
      }
    }
    expect(rows).toBe(4);
  });
});
