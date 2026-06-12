import Link from "next/link";

const SECTIONS: { href: string; label: string; hint: string }[] = [
  { href: "/", label: "Agent", hint: "Chat + tasks" },
  { href: "/stoicism", label: "Stoicism", hint: "The guide" },
  { href: "/stoics", label: "Stoics", hint: "The philosophers" },
  { href: "/wisdom", label: "Wisdom", hint: "Top quotes" },
  { href: "/books", label: "Books", hint: "Canonical texts" },
  { href: "/images", label: "Images", hint: "Generated cards" },
  { href: "/audio", label: "Audio", hint: "TTS + meditations" },
  { href: "/videos", label: "Videos", hint: "Short-form clips" },
];

export default function LeftNav() {
  return (
    <nav className="sticky top-20 text-sm">
      <ul className="flex flex-col gap-0.5">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href as never}
              className="flex flex-col gap-0 rounded px-2 py-1.5 hover:bg-[var(--accent-soft)]"
            >
              <span className="font-medium text-[var(--ink)]">{s.label}</span>
              <span className="text-[11px] text-[var(--ink-soft)]">{s.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-[11px] text-[var(--ink-soft)] border-t border-[var(--rule)] pt-3">
        <p className="font-mono">stoicai · :17003</p>
        <p className="mt-1">{new Date().getFullYear()} CleverFox</p>
      </div>
    </nav>
  );
}
