import Link from "next/link";
import { listMedia, humanBytes } from "@/lib/media-browse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Images — StoicAI",
  description: "Generated quote cards + Stoic illustrations. Brand-consistent FLUX art mirrored from com27.",
};

export default async function ImagesPage() {
  const items = await listMedia("images", 100);

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Images</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
        Brand-consistent illustrations, generated on demand.
      </h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        FLUX via Runware ({`runware:100@1`}) produces parchment-and-ink Stoic art with a deep-cyan
        accent. Click <em>+ media</em> on any{" "}
        <Link href="/wisdom" className="text-[var(--accent)] hover:underline">wisdom card</Link>{" "}
        to generate; results cache to <span className="font-mono">com27/stoicai/images/</span>.
      </p>
      {items.length === 0 ? (
        <div className="mt-6 rounded border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--ink-soft)]">
          No images yet. Visit <Link href="/wisdom" className="text-[var(--accent)] hover:underline">/wisdom</Link>,
          open any card&apos;s media panel, and click <em>generate</em>.
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((m) => (
            <li key={m.item_id} className="rounded-lg border border-[var(--rule)] bg-[var(--shell-bg)] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.wisdom?.source_ref ?? m.item_id} className="w-full aspect-square object-cover" />
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
