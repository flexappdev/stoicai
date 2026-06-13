import Link from "next/link";
import { listMedia, humanBytes } from "@/lib/media-browse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Audio — StoicAI",
  description: "TTS-voiced passages. OpenAI TTS-1 (onyx voice) on demand, mirrored to com27.",
};

export default async function AudioPage() {
  const items = await listMedia("audio", 100);
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Audio</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
        Stoic passages, spoken.
      </h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        OpenAI TTS-1 voices any passage (default <span className="font-mono">onyx</span> —
        a Senecan-mentor register). Generation triggered from <em>+ media</em> on any{" "}
        <Link href="/wisdom" className="text-[var(--accent)] hover:underline">wisdom card</Link>;
        cached MP3s land in <span className="font-mono">com27/stoicai/audio/</span>.
      </p>
      {items.length === 0 ? (
        <div className="mt-6 rounded border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--ink-soft)]">
          No audio yet. Add <span className="font-mono">OPENAI_API_KEY</span> to{" "}
          <span className="font-mono">.env.local</span> and trigger generation from{" "}
          <Link href="/wisdom" className="text-[var(--accent)] hover:underline">/wisdom</Link>.
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((m) => (
            <li key={m.item_id} className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] p-3 flex flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-mono text-[var(--ink-soft)]">{m.wisdom?.source_ref ?? m.item_id}</span>
                <span className="text-[10px] text-[var(--ink-soft)] font-mono">{humanBytes(m.bytes)}</span>
              </div>
              {m.wisdom && <blockquote className="text-sm text-[var(--ink)] italic">&ldquo;{m.wisdom.text}&rdquo;</blockquote>}
              <audio controls src={m.url} className="w-full">
                Your browser doesn&apos;t support audio.
              </audio>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
