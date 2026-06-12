export default function ImagesPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Images</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Quote cards + philosopher portraits, brand-consistent.</h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        FLUX (via Runware) generates brand-consistent quote cards and philosopher art. Per-item generate
        button on every passage page; cached to <span className="font-mono">com27/stoicai/images/</span>{" "}
        once produced. Ships in Phase 6.
      </p>
      <div className="mt-6 rounded border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--ink-soft)]">
        Empty. Generated images attach to <span className="font-mono">media.image_id</span> on each item.
      </div>
    </div>
  );
}
