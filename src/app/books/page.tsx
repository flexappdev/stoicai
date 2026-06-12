const WORKS = [
  { title: "Meditations", author: "Marcus Aurelius", translator: "George Long (1862)", chunks: "~1,200" },
  { title: "Letters to Lucilius", author: "Seneca", translator: "Richard M. Gummere (1917)", chunks: "~2,500" },
  { title: "Essays (Shortness of Life, On Anger…)", author: "Seneca", translator: "Aubrey Stewart (1900)", chunks: "~1,000" },
  { title: "Discourses", author: "Epictetus", translator: "George Long (1890)", chunks: "~2,000" },
  { title: "Enchiridion", author: "Epictetus", translator: "T. W. Higginson (1865)", chunks: "~250" },
  { title: "Lectures", author: "Musonius Rufus", translator: "Cora Lutz (PD trans)", chunks: "~300" },
  { title: "Lives of the Stoics", author: "Diogenes Laertius", translator: "R. D. Hicks (1925)", chunks: "~400" },
  { title: "Tusculan Disputations + De Officiis", author: "Cicero (Stoic-adjacent)", translator: "C. D. Yonge (PD)", chunks: "~600" },
];

export default function BooksPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Books</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Canonical Stoic works — readable in-app.</h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        All public-domain translations. Each work reads chapter by chapter with an inline
        &ldquo;explain this passage&rdquo; agent prompt. Books reader ships in Phase 5.
      </p>
      <ul className="mt-6 divide-y divide-[var(--rule)] border border-[var(--rule)] rounded">
        {WORKS.map((w) => (
          <li key={w.title} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <span className="font-medium">{w.title}</span>{" "}
              <span className="text-[var(--ink-soft)]">— {w.author}</span>
            </div>
            <div className="text-xs text-[var(--ink-soft)] font-mono">
              {w.translator} · {w.chunks}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
