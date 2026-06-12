export default function AudioPage() {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-[var(--accent)] font-medium">Audio</p>
      <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">TTS passages + daily meditation audio.</h1>
      <p className="text-[var(--ink-soft)] max-w-2xl mt-3">
        Piper TTS converts any passage into voiced audio with chapter markers. Daily 5-minute Stoic
        meditation audio compiled from <span className="font-mono">use_contexts: morning</span>. Caches to
        <span className="font-mono"> com27/stoicai/audio/</span>. Ships in Phase 6.
      </p>
      <div className="mt-6 rounded border border-dashed border-[var(--rule)] p-6 text-sm text-[var(--ink-soft)]">
        Empty. Generated audio attaches to <span className="font-mono">media.audio_id</span> on each item.
      </div>
    </div>
  );
}
