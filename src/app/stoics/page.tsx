const STOICS = [
  { slug: "zeno", name: "Zeno of Citium", years: "~334–262 BCE", note: "Founder. Stood on the Painted Porch." },
  { slug: "cleanthes", name: "Cleanthes", years: "~330–230 BCE", note: "Second scholarch. Hymn to Zeus." },
  { slug: "chrysippus", name: "Chrysippus", years: "~279–206 BCE", note: "Third scholarch. Systematizer." },
  { slug: "cato", name: "Cato the Younger", years: "95–46 BCE", note: "Stoic in deed; Roman political conscience." },
  { slug: "seneca", name: "Seneca the Younger", years: "~4 BCE–65 CE", note: "Letters to Lucilius; tutor to Nero." },
  { slug: "musonius", name: "Musonius Rufus", years: "~30–101 CE", note: "Teacher of Epictetus; austere ethics." },
  { slug: "epictetus", name: "Epictetus", years: "~50–135 CE", note: "Born a slave. Discourses. Enchiridion." },
  { slug: "marcus", name: "Marcus Aurelius", years: "121–180 CE", note: "Emperor. Meditations, to himself." },
];

export default function StoicsPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">The Stoics</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Zeno to Marcus — eight lives in the school.</h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        Each profile carries a timeline, the works the philosopher left behind, and their top items
        from the dataset. Pulled live from <span className="font-mono">stoics</span> + <span className="font-mono">stoic_items</span> in Phase 4.
      </p>
      <ol className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STOICS.map((s, i) => (
          <li key={s.slug} className="rounded border border-[var(--rule)] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium">{i + 1}. {s.name}</span>
              <span className="text-xs text-[var(--ink-soft)] font-mono">{s.years}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{s.note}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
