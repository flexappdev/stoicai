// Stoicism — concept taxonomy for /stoicism.
// 12 curated concepts spanning intro → intermediate → deep tracks. Each
// becomes a static page at /stoicism/concept/<slug>. When Phase 1.6 ingest
// + Phase 2.1 enrichment populate `concept` and `exercise` items in
// `stoic_items`, each concept page can pull its associated passages + an
// inline mentor-explain button.

export type Track = "intro" | "intermediate" | "deep";

export interface Concept {
  slug: string;
  name: string;
  track: Track;
  one_liner: string;
  body: string;
  greek?: string;
  see_also?: string[];           // other concept slugs
  associated_stoics?: string[];  // stoic slugs
  themes?: string[];
}

export const CONCEPTS: Concept[] = [
  {
    slug: "dichotomy-of-control",
    name: "The dichotomy of control",
    track: "intro",
    greek: "ἐφ' ἡμῖν / οὐκ ἐφ' ἡμῖν (eph' hēmin / ouk eph' hēmin)",
    one_liner: "Some things are up to you. Some things aren't. Govern the first, accept the second.",
    body: "Epictetus opens the Enchiridion with this distinction and refuses to move past it until you grasp it. Your opinions, your impulses, your choices, your willingness to act — these are up to you. Your body, your reputation, your possessions, who your boss is, what the weather does, whether the plane lands on time — these are not, not fully. The Stoic move isn't to deny that externals matter; it's to refuse to pour your wellbeing into them. Desire only what's up to you and you can never be frustrated; aim your aversion only at what's up to you and you can never be made wretched.",
    see_also: ["amor-fati", "premeditatio-malorum", "prokope"],
    associated_stoics: ["epictetus", "marcus"],
    themes: ["control", "judgment"],
  },
  {
    slug: "four-virtues",
    name: "The four cardinal virtues",
    track: "intro",
    one_liner: "Wisdom, courage, justice, temperance — the only true goods.",
    body: "The Stoics inherited the four-virtue scheme from Plato and made it the entire substance of the good life. Wisdom (phronesis) is practical judgment — knowing what to do here, now, with these people. Courage (andreia) is the willingness to act on that judgment when it costs you. Justice (dikaiosynē) is treating others as fellow rational beings, members of the same cosmopolis. Temperance (sōphrosynē) is the discipline of desires and appetites — wanting the right things, in the right amount, for the right reasons. Everything else — health, wealth, reputation — is a preferred indifferent: nice to have, but morally weightless.",
    see_also: ["preferred-indifferents", "logos"],
    associated_stoics: ["zeno", "chrysippus", "marcus"],
    themes: ["virtue"],
  },
  {
    slug: "memento-mori",
    name: "Memento mori",
    track: "intro",
    one_liner: "Remember you will die — not to be morbid, but to be present.",
    body: "Marcus reminds himself daily that he is mortal. Not as a goth's affectation but as a corrective: against fame, against grudges, against trivialities, against postponing the life you mean to live. Seneca says we don't lack time, we waste it; we behave as if we have an infinite supply. Hold the thought of your death lightly and often, and the trivial gets demoted, the important gets clear, and ordinary moments become sufficient because you stop demanding they be permanent.",
    see_also: ["amor-fati", "carpe-diem-vs-stoic-now"],
    associated_stoics: ["marcus", "seneca"],
    themes: ["death", "time"],
  },
  {
    slug: "premeditatio-malorum",
    name: "Premeditatio malorum",
    track: "intermediate",
    one_liner: "Rehearse what could go wrong — to take its sting out, not to feed anxiety.",
    body: "Before a difficult day, name what could go badly: the colleague who interrupts, the train that's cancelled, the conversation that escalates. Walk through your Stoic response in each case. This isn't pessimism (which the Stoics reject); it's preparation. The point is not to predict — you'll be wrong — but to prevent the moment of grievance: \"how dare this happen.\" When it does happen, you've already metabolized it. You don't need to add surprise to the difficulty.",
    see_also: ["dichotomy-of-control", "evening-review"],
    associated_stoics: ["seneca", "epictetus"],
    themes: ["anxiety", "discipline"],
  },
  {
    slug: "evening-review",
    name: "The evening review",
    track: "intermediate",
    one_liner: "Three questions at day's end. What did I do well, where did I fail, how will I improve.",
    body: "Seneca attributes this practice to Sextius and adopts it: \"What ailment of mine have I cured today? What vice have I resisted? In what respect am I better?\" Not a guilt audit — a calibration. The Stoic doesn't expect virtue to arrive in one move; she expects to overshoot and undershoot and slowly tighten the loop. The review is the loop closing. Done in writing, fifteen minutes a night, it changes what you notice during the day.",
    see_also: ["premeditatio-malorum", "prokope"],
    associated_stoics: ["seneca"],
    themes: ["discipline", "time", "judgment"],
  },
  {
    slug: "amor-fati",
    name: "Amor fati",
    track: "intermediate",
    one_liner: "Love what happens, not because it's good, but because you can't unmake it.",
    body: "The phrase is later (Nietzsche made it famous), but the move is pure Stoic and pure Marcus: \"Accept the things to which fate binds you, and love the people with whom fate brings you together.\" To resist what has already happened is to demand a different past, which is to spend your energy on a closed door. Acceptance isn't passivity — it's the precondition for clear-eyed action on what remains open. You stop relitigating the loss and start working with what you actually have.",
    see_also: ["dichotomy-of-control", "memento-mori"],
    associated_stoics: ["marcus", "epictetus"],
    themes: ["adversity", "control", "judgment"],
  },
  {
    slug: "preferred-indifferents",
    name: "Preferred indifferents",
    track: "intermediate",
    one_liner: "Health, wealth, status — pursue them without staking your virtue on having them.",
    body: "If only virtue is good, what about health and money? The Stoics' answer: prefer them, pursue them within reason, but don't make them load-bearing for your sense of who you are. A wise person prefers health to sickness — but the wise person sick is still wise. Wealth is preferable to poverty — but a wise person in poverty isn't worse for it morally. The distinction lets the Stoic engage with ordinary life (career, family, money) without becoming hostage to it.",
    see_also: ["four-virtues"],
    associated_stoics: ["chrysippus", "seneca"],
    themes: ["wealth", "virtue"],
  },
  {
    slug: "prokope",
    name: "Prokope — progress",
    track: "intermediate",
    greek: "προκοπή",
    one_liner: "The wise person is rare. Everyone else is a prokoptōn — someone making progress.",
    body: "The Stoic sage (the perfectly wise person) is partly an idealization — most Stoics admit they've never met one. What you actually are, on a good day, is a prokoptōn: someone in motion toward virtue. This matters because it changes how you treat your own failures. You're not a perfect being who's fallen short; you're a beginner in a long apprenticeship, and slips are evidence you're trying, not evidence you've failed. The point is to keep stepping.",
    see_also: ["evening-review", "four-virtues"],
    associated_stoics: ["epictetus", "musonius"],
    themes: ["discipline", "judgment"],
  },
  {
    slug: "view-from-above",
    name: "The view from above",
    track: "intermediate",
    one_liner: "Mentally zoom out. Your problems shrink. So does your ego.",
    body: "Marcus uses this constantly: imagine you're looking down at the Earth from very high up. The people you envy and the people you grieve are small. The borders dissolve, the politicking shrinks, your reputation is invisible. It's a deliberate trick of scale to put proportion back into a mind that has lost it. Done well, it's not nihilism (\"none of it matters\") but recalibration (\"most of what I'm fixated on doesn't matter as much as I just felt it did\").",
    see_also: ["memento-mori", "amor-fati"],
    associated_stoics: ["marcus"],
    themes: ["fame", "judgment", "time"],
  },
  {
    slug: "logos",
    name: "Logos",
    track: "deep",
    greek: "λόγος",
    one_liner: "The rational structure of the cosmos — and the rational faculty in you that participates in it.",
    body: "Stoic physics is monistic: the cosmos is a single rational, providential whole, and what makes it cohere is logos — reason, the principle of order. Your own ruling faculty (hēgemonikon) is a fragment of this same logos; that's what makes you capable of virtue. This isn't ornament — it's load-bearing in Stoic ethics. Following nature isn't \"do what feels natural\"; it's \"act in accord with the rational order, of which you are a part.\" Cleanthes's Hymn to Zeus is the most concentrated early-Stoic statement of this view.",
    see_also: ["oikeiosis", "four-virtues"],
    associated_stoics: ["zeno", "cleanthes", "chrysippus"],
    themes: ["virtue", "judgment"],
  },
  {
    slug: "oikeiosis",
    name: "Oikeiosis",
    track: "deep",
    greek: "οἰκείωσις",
    one_liner: "The natural appropriation of self, then family, then community, then humanity.",
    body: "Stoic developmental psychology: an infant first cares about its own constitution; as it grows, the circle of concern expands — to parents, to friends, to fellow citizens, to all rational beings. Justice is not a duty imposed from outside; it's the mature form of a natural impulse. The cosmopolis (the community of all rational beings) is the endpoint. Hierocles's circles diagram makes this concrete: the work of virtue is to pull the outer circles inward — to treat strangers as kin and humans as a family.",
    see_also: ["logos", "four-virtues"],
    associated_stoics: ["chrysippus", "musonius", "marcus"],
    themes: ["friendship", "virtue", "judgment"],
  },
  {
    slug: "impressions-and-assent",
    name: "Impressions and assent",
    track: "deep",
    greek: "φαντασία / συγκατάθεσις",
    one_liner: "Between what happens to you and your reaction, there is a moment of judgment. That moment is yours.",
    body: "An impression (phantasia) is what life throws at you — a cancellation, an insult, a temptation. The Stoic move is to insert a pause before assent (sunkatathesis): the act of agreeing that the impression is what it claims to be, and that the reaction it's prompting is the right one. Epictetus's whole training is on this pause. \"Wait, impression. Let me see what you are.\" Most distress isn't caused by the event; it's caused by hasty assent — agreeing too fast that this is unbearable, that this is unjust, that I have to respond now.",
    see_also: ["dichotomy-of-control", "prokope"],
    associated_stoics: ["chrysippus", "epictetus"],
    themes: ["judgment", "control", "anger"],
  },
];

export const TRACKS: { slug: Track; label: string; desc: string; concepts: () => Concept[] }[] = [
  {
    slug: "intro",
    label: "Intro",
    desc: "Read these cold. Five sittings of fifteen minutes will give you the working vocabulary.",
    concepts: () => CONCEPTS.filter((c) => c.track === "intro"),
  },
  {
    slug: "intermediate",
    label: "Intermediate",
    desc: "Practices, not just ideas. The intro track tells you what the Stoics believed; this track tells you what they did.",
    concepts: () => CONCEPTS.filter((c) => c.track === "intermediate"),
  },
  {
    slug: "deep",
    label: "Deep",
    desc: "Stoic physics, logic, and the technical psychology that makes the ethics work. For when the surface no longer satisfies.",
    concepts: () => CONCEPTS.filter((c) => c.track === "deep"),
  },
];

export function getConcept(slug: string): Concept | undefined {
  return CONCEPTS.find((c) => c.slug === slug);
}
