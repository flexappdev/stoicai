import { describe, it, expect } from "vitest";
import { chunk } from "../scripts/ingest/chunker";

// Default minLen=60, so test fixtures need passages long enough to survive
// the filter — the chunker is for real Stoic prose, not toy phrases.

describe("chunker", () => {
  it("splits Meditations BOOK + Roman-numeral passages", () => {
    const body = `
THE FIRST BOOK

I. Of my grandfather Verus I have learned to be gentle and meek, and to refrain from all anger and passion. From the same, both by his good example and good advice, to give the place to virtue.
II. Of him that brought me up, not to be fondly addicted to either of the two great factions of the coursers in the circus, called Prasini and Veneti: nor in the amphitheatre.
III. Of Diognetus, not to busy myself about vain things, and not easily to believe those things which are commonly spoken, by such as take upon them to work wonders.

THE SECOND BOOK

I. Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial.
II. Whatsoever this is that I am, it is a little flesh and breath, and the ruling part. Throw away thy books; no longer distract thyself: it is not allowed.
`;
    const out = chunk(body, { mode: "meditations" });
    expect(out.length).toBeGreaterThanOrEqual(5);
    expect(out[0].ref).toBe("1.1");
    expect(out[0].text).toMatch(/grandfather Verus/);
    const second = out.find((c) => c.ref === "2.1");
    expect(second?.text).toMatch(/Begin the morning/);
  });

  it("splits Enchiridion numbered chapters", () => {
    const body = `
1. There are things which are within our power, and there are things which are beyond our power. Within our power are opinion, aim, desire, aversion, and, in one word, whatever affairs are our own.
2. Remember that desire demands the attainment of that of which you are desirous; and aversion demands the avoidance of that to which it is averse.
3. With regard to whatever objects either delight the mind or contribute to use or are tenderly beloved, remember to tell yourself of what general nature they are.
`;
    const out = chunk(body, { mode: "enchiridion" });
    expect(out.length).toBeGreaterThanOrEqual(3);
    expect(out[0].text).toMatch(/within our power/);
  });

  it("paragraph fallback returns at least one chunk", () => {
    const body =
      "First paragraph here, long enough to clear the sixty-character minimum length filter and survive normalisation in the chunker pipeline.\n\nSecond paragraph here, also long enough to be retained — at least sixty characters of useful content, no padding, no boilerplate.";
    const out = chunk(body, { mode: "paragraphs", refPrefix: "p" });
    expect(out.length).toBeGreaterThanOrEqual(2);
  });

  it("filters out tiny chunks below minLen", () => {
    const body = "Tiny.\n\nAnother small one.";
    const out = chunk(body, { mode: "paragraphs", refPrefix: "p", minLen: 200 });
    expect(out.length).toBe(0);
  });
});
