export default function StoicismPage() {
  return (
    <article className="prose prose-stone max-w-none">
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Stoicism — the guide</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">A working manual, not a museum tour.</h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        Three tracks build through history → physics/logic/ethics → the daily practices (dichotomy of
        control, amor fati, memento mori, premeditatio malorum, evening review). Track content is
        sourced from the <span className="font-mono">concept</span> + <span className="font-mono">exercise</span> item types
        in the dataset. Coming online in Phase 4.
      </p>
      <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm not-prose">
        {[
          { t: "Intro", b: "What Stoicism is — and isn't. The school's history. The four virtues." },
          { t: "Intermediate", b: "Logos, oikeiosis, the dichotomy of control, premeditatio malorum." },
          { t: "Deep", b: "Stoic physics + logic. Critique, modern objections, Stoic-adjacent texts." },
        ].map((x) => (
          <li key={x.t} className="rounded border border-[var(--rule)] p-3">
            <div className="font-medium">{x.t}</div>
            <div className="text-[var(--ink-soft)] mt-1">{x.b}</div>
          </li>
        ))}
      </ul>
    </article>
  );
}
