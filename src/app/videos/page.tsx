import Link from "next/link";
import { listMedia, humanBytes } from "@/lib/media-browse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Videos — StoicAI",
  description: "Short ambient clips for Stoic passages. Seedance via Runware, 5s 9:16 vertical.",
};

export default async function VideosPage() {
  const items = await listMedia("videos", 60);
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Videos</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
        Ambient short-form clips.
      </h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        Seedance (<span className="font-mono">bytedance:2@2</span>) via Runware generates 5-second
        9:16 vertical clips — marble bust + candlelight + dust + #006699 cool tone — for any
        passage. Cost ~$0.25 per clip; spend-gated. Trigger from <em>+ media</em> on a{" "}
        <Link href="/wisdom" className="text-[var(--accent)] hover:underline">wisdom card</Link>.
      </p>
      {items.length === 0 ? (
        <div className="mt-6 rounded border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--ink-soft)]">
          No videos yet. Open any wisdom card&apos;s media panel and confirm the cost prompt.
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => (
            <li key={m.item_id} className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] overflow-hidden">
              <video controls src={m.url} className="w-full aspect-[9/16] bg-black">
                Your browser doesn&apos;t support video.
              </video>
              <div className="p-2 text-[11px] text-[var(--ink-soft)]">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-mono truncate">{m.wisdom?.source_ref ?? m.item_id}</span>
                  <span>{humanBytes(m.bytes)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
