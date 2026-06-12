export default function WisdomPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Wisdom</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Top-scored quotes — filterable, citable, shareable.</h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        Pulls items with <span className="font-mono">quality_score &gt; 85</span> and{" "}
        <span className="font-mono">verified = true</span>. Filter by theme (adversity, anger, death,
        control…), virtue (wisdom, courage, justice, temperance), context (morning, evening, crisis,
        decision), and author. Each card cites its source and links to the parent work.
      </p>
      <div className="mt-6 rounded border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--ink-soft)]">
        Awaiting Phase 1 ingest + Phase 2 enrichment. Daily pick + share-card composer ship in Phase 4.
      </div>
    </div>
  );
}
