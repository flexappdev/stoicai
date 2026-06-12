// Hard-coded Stoic + work data — single source of truth for the UI while
// the Supabase schema is still pending application. Mirrors the seed.ts
// inserts so when the DB is populated, /stoics/[slug] can swap to a query
// without touching the page-level types.

export type Era = "early" | "roman";

export interface Stoic {
  slug: string;
  name: string;
  birth_year: number;
  death_year: number;
  era: Era;
  one_liner: string;
  bio: string;
  key_works: string[]; // work slugs
  themes: string[];
  rank: number;
}

export interface Work {
  slug: string;
  title: string;
  author_slug: string | null;
  translator: string;
  translation_year: number;
  est_chunks: number;
  rank: number;
  gutenberg_id?: string;
  wikisource_url?: string;
}

export const STOICS: Stoic[] = [
  {
    slug: "zeno",
    name: "Zeno of Citium",
    birth_year: -334,
    death_year: -262,
    era: "early",
    one_liner: "Founder of the Stoic school. Stood on the Painted Porch (Stoa Poikile).",
    bio: "Born in Citium on Cyprus, Zeno arrived in Athens after a shipwreck — an accident he later called his most fortunate. He studied with Crates the Cynic, then Stilpo and the Megarians, then founded his own school around 300 BCE. He taught not in a building but on the Stoa Poikile (\"Painted Porch\") in the Athenian agora — and the school took its name from the place. Almost none of his writing survives; what we know comes through Diogenes Laertius. His three-part division — logic, physics, ethics — set the structure for everything that followed.",
    key_works: [],
    themes: ["virtue", "discipline", "judgment"],
    rank: 1,
  },
  {
    slug: "cleanthes",
    name: "Cleanthes of Assos",
    birth_year: -330,
    death_year: -230,
    era: "early",
    one_liner: "Second scholarch. Wrote the Hymn to Zeus.",
    bio: "Came to Athens as a boxer with little money and worked nights drawing water to fund his days with Zeno. After Zeno's death in 262 BCE he led the school for 32 years. His Hymn to Zeus — one of the only substantial early-Stoic texts to survive — frames the cosmos as governed by a divine logos, and the Stoic project as living in accord with that order. He died by deliberate fasting, refusing food after a swollen gum kept him from eating.",
    key_works: [],
    themes: ["virtue", "control", "time"],
    rank: 2,
  },
  {
    slug: "chrysippus",
    name: "Chrysippus of Soli",
    birth_year: -279,
    death_year: -206,
    era: "early",
    one_liner: "Third scholarch. Systematizer of Stoic logic.",
    bio: "\"If there had been no Chrysippus, there would have been no Stoa.\" He wrote more than 700 books — practically none survive intact — and built out Stoic propositional logic, theory of impressions, and theory of fate to such depth that Stoicism's intellectual rigor under Roman writers two centuries later still rested on his framework. Stories say he died laughing at his own joke about a donkey eating figs.",
    key_works: [],
    themes: ["judgment", "control", "virtue"],
    rank: 3,
  },
  {
    slug: "cato",
    name: "Cato the Younger",
    birth_year: -95,
    death_year: -46,
    era: "roman",
    one_liner: "Stoic in deed. Roman political conscience under the late Republic.",
    bio: "Marcus Porcius Cato Uticensis lived Stoicism as politics. He opposed Pompey's expansionism and Caesar's ambition with the same uncompromising rigor — refusing bribes, walking barefoot in summer to harden himself, sleeping on bare boards. When Caesar finally cornered the senatorial faction at Utica, Cato killed himself rather than accept clemency: to receive pardon from a tyrant would acknowledge the tyrant's right to grant it. Seneca and Marcus Aurelius both cite him as a moral exemplar.",
    key_works: [],
    themes: ["virtue", "courage", "fame"],
    rank: 4,
  },
  {
    slug: "seneca",
    name: "Lucius Annaeus Seneca",
    birth_year: -4,
    death_year: 65,
    era: "roman",
    one_liner: "Letters to Lucilius. Tutor — and eventually victim — of Nero.",
    bio: "Born in Spain, exiled to Corsica under Claudius, recalled to tutor the young Nero, then politically central in the first years of the principate — Seneca is the most readable of the Stoics for a modern reader. His Letters to Lucilius (124 letters written in his last years) and essays (On the Shortness of Life, On Anger, On Tranquility of Mind) treat Stoicism as a working manual for life under pressure. Forced to suicide in 65 CE after being implicated in a conspiracy against Nero, he opened his veins in a bath while continuing to dictate to scribes — the Senecan death, half theatrical, half exemplary.",
    key_works: ["letters-lucilius", "senecan-essays"],
    themes: ["anger", "time", "wealth", "death", "anxiety"],
    rank: 5,
  },
  {
    slug: "musonius",
    name: "Gaius Musonius Rufus",
    birth_year: 30,
    death_year: 101,
    era: "roman",
    one_liner: "Teacher of Epictetus. Stoic austerity made specific and practical.",
    bio: "Exiled twice — once by Nero, once by Vespasian — Musonius taught a Stoicism stripped to its working parts. His Lectures (preserved in fragments by Stobaeus) argue that philosophy must show up in what you eat, what you wear, how you sleep, who you marry, and how you treat your slaves. He insisted women should study philosophy on the same terms as men, that exile is no real loss, and that anger is always avoidable. His most famous student, Epictetus, took the practice further.",
    key_works: ["musonius-lectures"],
    themes: ["discipline", "virtue", "anger", "wealth"],
    rank: 6,
  },
  {
    slug: "epictetus",
    name: "Epictetus",
    birth_year: 50,
    death_year: 135,
    era: "roman",
    one_liner: "Born a slave. Discourses. Enchiridion.",
    bio: "Born into slavery in Hierapolis (modern Pamukkale, Turkey), Epictetus was owned by Epaphroditus — a freedman of Nero's — who allowed him to study with Musonius. Freed sometime after Nero's death, he taught in Rome until Domitian's expulsion of philosophers, then founded his school in Nicopolis in northwestern Greece. He wrote nothing; his student Arrian transcribed the Discourses and condensed the practical core into the Enchiridion (handbook). The core move: divide what is up to you from what is not, and direct desire only at the first.",
    key_works: ["discourses", "enchiridion"],
    themes: ["control", "judgment", "discipline", "adversity"],
    rank: 7,
  },
  {
    slug: "marcus",
    name: "Marcus Aurelius",
    birth_year: 121,
    death_year: 180,
    era: "roman",
    one_liner: "Emperor of Rome. Meditations — written to himself.",
    bio: "Adopted into the line of succession at 17, emperor from 161 until his death of plague (or plague-adjacent illness) on the Danube frontier in 180. The Meditations — twelve short books — were never intended for publication; they read as a working notebook of self-correction, written in Greek during night watches on the German wars. The motifs return obsessively: the brevity of life, the mind's freedom even when the body and reputation are not, the duty to the common project of mankind, the absurdity of fame, and the necessity of acting well now because there is no later. The most quoted Stoic, for good reason.",
    key_works: ["meditations"],
    themes: ["death", "time", "control", "discipline", "fame", "judgment"],
    rank: 8,
  },
];

export const WORKS: Work[] = [
  { slug: "meditations",       title: "Meditations",                               author_slug: "marcus",    translator: "George Long",     translation_year: 1862, est_chunks: 1200, rank: 1, gutenberg_id: "2680"   },
  { slug: "letters-lucilius",  title: "Letters to Lucilius",                       author_slug: "seneca",    translator: "Richard M. Gummere", translation_year: 1917, est_chunks: 2500, rank: 2, wikisource_url: "https://en.wikisource.org/wiki/Moral_letters_to_Lucilius" },
  { slug: "senecan-essays",    title: "Essays (Shortness of Life, On Anger…)",     author_slug: "seneca",    translator: "Aubrey Stewart",  translation_year: 1900, est_chunks: 1000, rank: 3 },
  { slug: "discourses",        title: "Discourses",                                author_slug: "epictetus", translator: "George Long",     translation_year: 1890, est_chunks: 2000, rank: 4, gutenberg_id: "10661"  },
  { slug: "enchiridion",       title: "Enchiridion",                               author_slug: "epictetus", translator: "T. W. Higginson", translation_year: 1865, est_chunks:  250, rank: 5, gutenberg_id: "45109"  },
  { slug: "musonius-lectures", title: "Lectures",                                  author_slug: "musonius",  translator: "Cora Lutz",       translation_year: 1947, est_chunks:  300, rank: 6 },
  { slug: "lives-stoics",      title: "Lives of the Stoics",                       author_slug: null,        translator: "R. D. Hicks",     translation_year: 1925, est_chunks:  400, rank: 7 },
  { slug: "cicero-tusculan",   title: "Tusculan Disputations + De Officiis",       author_slug: null,        translator: "C. D. Yonge",     translation_year: 1877, est_chunks:  600, rank: 8 },
];

export function getStoic(slug: string): Stoic | undefined {
  return STOICS.find((s) => s.slug === slug);
}

export function getWork(slug: string): Work | undefined {
  return WORKS.find((w) => w.slug === slug);
}

export function worksByAuthor(slug: string): Work[] {
  return WORKS.filter((w) => w.author_slug === slug);
}

export function formatYears(birth: number, death: number): string {
  const b = birth < 0 ? `${-birth} BCE` : `${birth} CE`;
  const d = death < 0 ? `${-death} BCE` : `${death} CE`;
  return `${b} – ${d}`;
}
