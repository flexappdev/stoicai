export default function VideosPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Videos</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Short-form wisdom clips, generated on demand.</h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        Seedance loops + Remotion composition produce 9:16 short clips combining quote text, voice-over,
        and ambient motion. Triggered by item-page &ldquo;Generate video&rdquo; button. Pipeline
        delegated to <span className="font-mono">/abc-videos</span> + <span className="font-mono">/abc-remotion</span>{" "}
        skills. Ships in Phase 6.
      </p>
      <div className="mt-6 rounded border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--ink-soft)]">
        Empty. Generated videos attach to <span className="font-mono">media.video_id</span> on each item.
      </div>
    </div>
  );
}
