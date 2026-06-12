// Idempotent seed for stoics, works, themes.
// The migration 0001 contains the same INSERT ... ON CONFLICT DO NOTHING
// statements, but if the schema was applied without the trailing seed block
// (e.g. partial paste into Studio SQL editor) the FK columns on stoic_items
// would fail to validate. Running this defensively before ingest is safe —
// every upsert is on-conflict-no-op.

import { adminClient } from "./db";

const STOICS = [
  { slug: "zeno",       name: "Zeno of Citium",     birth_year: -334, death_year: -262, era: "early", one_liner: "Founder. Painted Porch.",          rank: 1 },
  { slug: "cleanthes",  name: "Cleanthes",          birth_year: -330, death_year: -230, era: "early", one_liner: "Second scholarch. Hymn to Zeus.",  rank: 2 },
  { slug: "chrysippus", name: "Chrysippus",         birth_year: -279, death_year: -206, era: "early", one_liner: "Third scholarch. Systematizer.",   rank: 3 },
  { slug: "cato",       name: "Cato the Younger",   birth_year:  -95, death_year:  -46, era: "roman", one_liner: "Stoic in deed; Roman conscience.", rank: 4 },
  { slug: "seneca",     name: "Seneca the Younger", birth_year:   -4, death_year:   65, era: "roman", one_liner: "Letters; tutor to Nero.",          rank: 5 },
  { slug: "musonius",   name: "Musonius Rufus",     birth_year:   30, death_year:  101, era: "roman", one_liner: "Teacher of Epictetus.",            rank: 6 },
  { slug: "epictetus",  name: "Epictetus",          birth_year:   50, death_year:  135, era: "roman", one_liner: "Discourses. Enchiridion.",         rank: 7 },
  { slug: "marcus",     name: "Marcus Aurelius",    birth_year:  121, death_year:  180, era: "roman", one_liner: "Emperor. Meditations.",            rank: 8 },
];

const WORKS = [
  { slug: "meditations",       title: "Meditations",                               author_slug: "marcus",    translator: "George Long",     translation_year: 1862, est_chunks: 1200, rank: 1 },
  { slug: "letters-lucilius",  title: "Letters to Lucilius",                       author_slug: "seneca",    translator: "R. M. Gummere",   translation_year: 1917, est_chunks: 2500, rank: 2 },
  { slug: "senecan-essays",    title: "Essays (Shortness of Life, On Anger…)",     author_slug: "seneca",    translator: "Aubrey Stewart",  translation_year: 1900, est_chunks: 1000, rank: 3 },
  { slug: "discourses",        title: "Discourses",                                author_slug: "epictetus", translator: "George Long",     translation_year: 1890, est_chunks: 2000, rank: 4 },
  { slug: "enchiridion",       title: "Enchiridion",                               author_slug: "epictetus", translator: "T. W. Higginson", translation_year: 1865, est_chunks:  250, rank: 5 },
  { slug: "musonius-lectures", title: "Lectures",                                  author_slug: "musonius",  translator: "Cora Lutz",       translation_year: 1947, est_chunks:  300, rank: 6 },
  { slug: "lives-stoics",      title: "Lives of the Stoics",                       author_slug: null,        translator: "R. D. Hicks",     translation_year: 1925, est_chunks:  400, rank: 7 },
  { slug: "cicero-tusculan",   title: "Tusculan Disputations + De Officiis",       author_slug: null,        translator: "C. D. Yonge",     translation_year: 1877, est_chunks:  600, rank: 8 },
];

const THEMES = [
  { slug: "adversity",  name: "Adversity",   description: "Hardship, obstacles, the test of character." },
  { slug: "death",      name: "Death",       description: "Mortality, memento mori, the brevity of life." },
  { slug: "anger",      name: "Anger",       description: "The destructive passion; cooling techniques." },
  { slug: "control",    name: "Control",     description: "The dichotomy: what is up to us and what is not." },
  { slug: "virtue",     name: "Virtue",      description: "The four cardinal virtues; the only true good." },
  { slug: "time",       name: "Time",        description: "Brevity, presentness, evening review." },
  { slug: "wealth",     name: "Wealth",      description: "External goods; preferred indifferents." },
  { slug: "friendship", name: "Friendship",  description: "The wise friend; rare and precious." },
  { slug: "fame",       name: "Fame",        description: "Reputation, posterity, public opinion." },
  { slug: "anxiety",    name: "Anxiety",     description: "Future-tripping; premeditatio malorum." },
  { slug: "discipline", name: "Discipline",  description: "Habit, training (askēsis), daily practice." },
  { slug: "judgment",   name: "Judgment",    description: "Impressions, assent, prokope." },
];

async function main() {
  const sb = adminClient();
  const r1 = await sb.from("stoics").upsert(STOICS, { onConflict: "slug" }).select("slug");
  if (r1.error) throw r1.error;
  const r2 = await sb.from("works").upsert(WORKS, { onConflict: "slug" }).select("slug");
  if (r2.error) throw r2.error;
  const r3 = await sb.from("themes").upsert(THEMES, { onConflict: "slug" }).select("slug");
  if (r3.error) throw r3.error;
  console.log(`✓ Seeded ${r1.data?.length ?? 0} stoics, ${r2.data?.length ?? 0} works, ${r3.data?.length ?? 0} themes`);
}

main().catch((e) => {
  if (e && typeof e === "object") {
    console.error("✗", JSON.stringify(e, null, 2));
  } else {
    console.error("✗", e instanceof Error ? e.message : String(e));
  }
  process.exit(1);
});
