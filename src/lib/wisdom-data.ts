// Curated top-quality passages for /wisdom.
// 30 entries spanning Marcus / Seneca / Epictetus / Musonius — each chosen
// for being memorable, citation-worthy, and useful as a working motto.
// Mirrors the StoicItemInsert shape so swap-to-DB is mechanical.

export type Virtue = "wisdom" | "courage" | "justice" | "temperance";
export type Context = "morning" | "evening" | "crisis" | "work" | "loss" | "conflict" | "decision";

export interface Wisdom {
  id: string;
  text: string;
  author_slug: string;
  source_ref: string;
  themes: string[];
  virtue: Virtue | null;
  use_contexts: Context[];
  quality_score: number;
}

export const WISDOM: Wisdom[] = [
  { id: "med-2-1",  text: "Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial. All these things happen to them by reason of their ignorance of what is good and evil.", author_slug: "marcus",    source_ref: "Meditations 2.1",  themes: ["anger","judgment","anxiety"],   virtue: "temperance", use_contexts: ["morning","conflict"],         quality_score: 92 },
  { id: "med-4-3",  text: "Men seek retreats for themselves, houses in the country, sea-shores, and mountains; and thou too art wont to desire such things very much. But this is altogether a mark of the most common sort of men, for it is in thy power whenever thou shalt choose to retire into thyself. For nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul.", author_slug: "marcus", source_ref: "Meditations 4.3", themes: ["control","anxiety","time"], virtue: "temperance", use_contexts: ["crisis","evening"], quality_score: 95 },
  { id: "med-4-7",  text: "Take away the opinion 'I have been harmed,' and the harm is taken away.", author_slug: "marcus",    source_ref: "Meditations 4.7",  themes: ["judgment","anger","control"],   virtue: "wisdom",     use_contexts: ["conflict","crisis"],          quality_score: 96 },
  { id: "med-5-1",  text: "In the morning when thou risest unwillingly, let this thought be present — I am rising to the work of a human being. Why then am I dissatisfied if I am going to do the things for which I exist?", author_slug: "marcus", source_ref: "Meditations 5.1", themes: ["discipline","virtue","time"], virtue: "courage", use_contexts: ["morning","work"], quality_score: 93 },
  { id: "med-6-2",  text: "It is thy duty to do every act of thy life as if it were thy last.", author_slug: "marcus", source_ref: "Meditations 2.5", themes: ["death","time","discipline"], virtue: "courage", use_contexts: ["morning"], quality_score: 94 },
  { id: "med-7-21", text: "Soon thou wilt have forgotten all things; soon all things will have forgotten thee.", author_slug: "marcus", source_ref: "Meditations 7.21", themes: ["death","time","fame"], virtue: null, use_contexts: ["crisis"], quality_score: 90 },
  { id: "med-8-46", text: "Nothing happens to anybody which he is not fitted by nature to bear.", author_slug: "marcus", source_ref: "Meditations 5.18", themes: ["adversity","control","courage"], virtue: "courage", use_contexts: ["crisis","loss"], quality_score: 91 },
  { id: "med-9-13", text: "Today I have got out of all trouble, or rather I have cast out all trouble, for it was not outside, but within and in my opinions.", author_slug: "marcus", source_ref: "Meditations 9.13", themes: ["control","judgment","anger"], virtue: "wisdom", use_contexts: ["evening","crisis"], quality_score: 92 },
  { id: "med-10-16", text: "Waste no more time arguing what a good man should be. Be one.", author_slug: "marcus", source_ref: "Meditations 10.16", themes: ["virtue","discipline","time"], virtue: "courage", use_contexts: ["morning","decision"], quality_score: 97 },
  { id: "med-11-18", text: "The best revenge is not to be like your enemy.", author_slug: "marcus", source_ref: "Meditations 6.6", themes: ["anger","virtue","judgment"], virtue: "justice", use_contexts: ["conflict"], quality_score: 95 },

  { id: "ench-1",   text: "Some things are in our control and others not. Things in our control are opinion, pursuit, desire, aversion, and, in a word, whatever are our own actions. Things not in our control are body, property, reputation, command, and, in one word, whatever are not our own actions.", author_slug: "epictetus", source_ref: "Enchiridion 1", themes: ["control","judgment"], virtue: "wisdom", use_contexts: ["morning","crisis","decision"], quality_score: 98 },
  { id: "ench-5",   text: "Men are disturbed not by the things which happen, but by the opinions about the things.", author_slug: "epictetus", source_ref: "Enchiridion 5", themes: ["judgment","anger","control"], virtue: "wisdom", use_contexts: ["crisis","conflict"], quality_score: 97 },
  { id: "ench-8",   text: "Don't demand that things happen as you wish, but wish that they happen as they do happen, and you will go on well.", author_slug: "epictetus", source_ref: "Enchiridion 8", themes: ["control","adversity"], virtue: "wisdom", use_contexts: ["crisis","loss"], quality_score: 94 },
  { id: "ench-11",  text: "Never say of anything, 'I have lost it,' but 'I have returned it.' Is your child dead? It is returned. Is your wife dead? She is returned. Is your estate taken away? Well, and is not that likewise returned?", author_slug: "epictetus", source_ref: "Enchiridion 11", themes: ["loss","death","control"], virtue: "courage", use_contexts: ["loss"], quality_score: 93 },
  { id: "ench-20",  text: "Remember, that not he who gives ill language or a blow insults, but the principle which represents these things as insulting. When, therefore, any one provokes you, be assured that it is your own opinion which provokes you.", author_slug: "epictetus", source_ref: "Enchiridion 20", themes: ["anger","judgment","control"], virtue: "temperance", use_contexts: ["conflict"], quality_score: 92 },
  { id: "ench-33",  text: "Be silent for the most part, or, if you speak, say only what is necessary, and in few words.", author_slug: "epictetus", source_ref: "Enchiridion 33", themes: ["discipline","judgment"], virtue: "temperance", use_contexts: ["work","conflict"], quality_score: 87 },
  { id: "ench-43",  text: "Everything has two handles, the one by which it may be borne, the other by which it cannot.", author_slug: "epictetus", source_ref: "Enchiridion 43", themes: ["judgment","adversity"], virtue: "wisdom", use_contexts: ["crisis","decision"], quality_score: 89 },
  { id: "ench-50",  text: "Whatever rules you propose to yourself, abide by them as laws.", author_slug: "epictetus", source_ref: "Enchiridion 50", themes: ["discipline","virtue"], virtue: "temperance", use_contexts: ["morning","decision"], quality_score: 86 },

  { id: "letters-1",   text: "Hold every hour in your grasp. Lay hold of today's task, and you will not need to depend so much upon tomorrow's. While we are postponing, life speeds by.", author_slug: "seneca", source_ref: "Letters 1.2", themes: ["time","discipline"], virtue: "temperance", use_contexts: ["morning","work"], quality_score: 94 },
  { id: "letters-3",   text: "If you consider any man a friend whom you do not trust as you trust yourself, you are mightily mistaken.", author_slug: "seneca", source_ref: "Letters 3.2", themes: ["friendship","judgment"], virtue: "justice", use_contexts: ["decision"], quality_score: 88 },
  { id: "letters-13",  text: "There are more things, Lucilius, likely to frighten us than there are to crush us; we suffer more often in imagination than in reality.", author_slug: "seneca", source_ref: "Letters 13.4", themes: ["anxiety","judgment"], virtue: "courage", use_contexts: ["crisis"], quality_score: 95 },
  { id: "letters-26",  text: "It is when we are off our guard that fortune brings disaster.", author_slug: "seneca", source_ref: "Letters 26.7", themes: ["adversity","discipline"], virtue: "temperance", use_contexts: ["morning"], quality_score: 86 },
  { id: "letters-47",  text: "Treat your inferiors as you would be treated by your betters.", author_slug: "seneca", source_ref: "Letters 47.11", themes: ["justice","friendship"], virtue: "justice", use_contexts: ["work","conflict"], quality_score: 89 },
  { id: "letters-58",  text: "He who fears death will never do anything worthy of a living man.", author_slug: "seneca", source_ref: "Letters 78.5", themes: ["death","courage"], virtue: "courage", use_contexts: ["decision","crisis"], quality_score: 91 },
  { id: "letters-71",  text: "If one does not know to which port one is sailing, no wind is favourable.", author_slug: "seneca", source_ref: "Letters 71.3", themes: ["judgment","discipline"], virtue: "wisdom", use_contexts: ["decision"], quality_score: 92 },
  { id: "letters-91",  text: "Whatever happens to one man can happen to any.", author_slug: "seneca", source_ref: "Letters 91.4", themes: ["adversity","control"], virtue: "temperance", use_contexts: ["crisis","loss"], quality_score: 88 },
  { id: "shortness-life-1", text: "It is not that we have a short time to live, but that we waste a lot of it.", author_slug: "seneca", source_ref: "On the Shortness of Life 1", themes: ["time","discipline"], virtue: "temperance", use_contexts: ["morning","evening"], quality_score: 96 },
  { id: "on-anger-3-30", text: "The greatest remedy for anger is delay.", author_slug: "seneca", source_ref: "On Anger 3.12", themes: ["anger","discipline"], virtue: "temperance", use_contexts: ["conflict"], quality_score: 90 },

  { id: "musonius-3", text: "It is not possible to live well today unless one treats it as one's last.", author_slug: "musonius", source_ref: "Lectures 6", themes: ["death","time","discipline"], virtue: "courage", use_contexts: ["morning"], quality_score: 87 },
  { id: "musonius-8", text: "Practice has the advantage over theory because it inclines a person more strongly to act than to argue about how he should act.", author_slug: "musonius", source_ref: "Lectures 5", themes: ["discipline","virtue"], virtue: "courage", use_contexts: ["work","decision"], quality_score: 88 },
];

export const ALL_THEMES = Array.from(new Set(WISDOM.flatMap((w) => w.themes))).sort();
export const ALL_AUTHORS = Array.from(new Set(WISDOM.map((w) => w.author_slug)));
export const ALL_VIRTUES: Virtue[] = ["wisdom", "courage", "justice", "temperance"];
export const ALL_CONTEXTS: Context[] = ["morning", "evening", "crisis", "work", "loss", "conflict", "decision"];

// Daily pick: deterministic by date, sorted by quality_score then hashed.
export function dailyPick(date = new Date()): Wisdom {
  const y = date.getUTCFullYear();
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  const key = `${y}${m}${d}`;
  // 32-bit FNV-1a-ish hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return WISDOM[h % WISDOM.length];
}
