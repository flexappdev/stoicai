import Link from "next/link";
import LeftNav from "./LeftNav";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--rule)] bg-[var(--background)]/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span
              aria-hidden
              className="inline-block h-5 w-5 rounded-sm"
              style={{ background: "var(--accent)" }}
            />
            <span className="text-[var(--ink)]">StoicAI</span>
            <span className="text-xs text-[var(--ink-soft)] hidden sm:inline">
              · ancient wisdom, AI-native
            </span>
          </Link>
          <nav className="text-sm flex items-center gap-4 text-[var(--ink-soft)]">
            <Link href="/wisdom" className="hover:text-[var(--accent)]">Wisdom</Link>
            <Link href="/books" className="hover:text-[var(--accent)]">Books</Link>
            <Link href="/" className="hover:text-[var(--accent)]">Agent</Link>
            <a
              href="https://github.com/flexappdev/stoicai"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--accent)]"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 py-6">
        <aside className="hidden md:block">
          <LeftNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
      <footer className="border-t border-[var(--rule)] text-xs text-[var(--ink-soft)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            StoicAI · 10K items · {new Date().getFullYear()} CleverFox · public domain Stoic corpus
          </span>
          <span className="font-mono">v0.1 — scaffold</span>
        </div>
      </footer>
    </div>
  );
}
