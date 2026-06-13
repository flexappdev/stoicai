"use client";

import { useEffect, useState } from "react";

interface MediaActionsProps {
  itemId: string;
  text: string;
  author: string;
  source_ref: string;
}

type Kind = "image" | "audio" | "video";

interface MediaState {
  url: string | null;
  busy: boolean;
  error: string | null;
  cached: boolean;
}

const INITIAL: MediaState = { url: null, busy: false, error: null, cached: false };

export default function MediaActions({ itemId, text, author, source_ref }: MediaActionsProps) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<MediaState>(INITIAL);
  const [audio, setAudio] = useState<MediaState>(INITIAL);
  const [video, setVideo] = useState<MediaState>(INITIAL);

  // Lazily probe once when the panel opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function probeOne(kind: Kind, set: (s: MediaState) => void) {
      try {
        const r = await fetch(`/api/media/${kind}?item_id=${encodeURIComponent(itemId)}`);
        if (!r.ok || cancelled) return;
        const j = await r.json();
        if (j.exists) set({ url: j[`${kind}_url`], busy: false, error: null, cached: true });
      } catch {
        // probe is best-effort
      }
    }
    void probeOne("image", setImage);
    void probeOne("audio", setAudio);
    void probeOne("video", setVideo);
    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  async function generate(kind: Kind, extraBody: object = {}) {
    const set = kind === "image" ? setImage : kind === "audio" ? setAudio : setVideo;
    set({ url: null, busy: true, error: null, cached: false });
    try {
      const res = await fetch(`/api/media/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, text, author, source_ref, ...extraBody }),
      });
      const j = await res.json();
      if (!res.ok) {
        if (res.status === 402 && kind === "video") {
          set({ url: null, busy: false, error: j.error ?? "video gated", cached: false });
          return;
        }
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      set({
        url: j[`${kind}_url`] ?? j.runware_url ?? null,
        busy: false,
        error: null,
        cached: !!j.cached,
      });
    } catch (e) {
      set({ url: null, busy: false, error: e instanceof Error ? e.message : String(e), cached: false });
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[var(--accent)] hover:underline"
      >
        + media
      </button>
    );
  }

  return (
    <div className="w-full mt-1 rounded border border-[var(--rule)] bg-[var(--paper)] p-2 text-[11px] flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-[var(--ink)]">Media</span>
        <button type="button" onClick={() => setOpen(false)} className="text-[var(--ink-soft)] hover:text-[var(--accent)]">close</button>
      </div>

      <MediaRow
        label="Image"
        kind="image"
        state={image}
        onGenerate={() => generate("image")}
        renderPreview={(url) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Generated illustration" className="w-full max-w-[200px] rounded border border-[var(--rule)]" />
        )}
      />

      <MediaRow
        label="Audio"
        kind="audio"
        state={audio}
        onGenerate={() => generate("audio")}
        renderPreview={(url) => (
          <audio controls src={url} className="w-full max-w-[260px]">
            Your browser doesn&apos;t support audio.
          </audio>
        )}
      />

      <MediaRow
        label="Video"
        kind="video"
        state={video}
        onGenerate={() => {
          if (
            typeof window !== "undefined" &&
            !confirm("Video generation costs ~$0.25 and takes 30–60s. Proceed?")
          ) return;
          generate("video", { confirm: true });
        }}
        renderPreview={(url) => (
          <video controls src={url} className="w-full max-w-[200px] rounded border border-[var(--rule)]">
            Your browser doesn&apos;t support video.
          </video>
        )}
      />
    </div>
  );
}

interface MediaRowProps {
  label: string;
  kind: Kind;
  state: MediaState;
  onGenerate: () => void;
  renderPreview: (url: string) => React.ReactNode;
}
function MediaRow({ label, state, onGenerate, renderPreview }: MediaRowProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-12 text-[var(--ink-soft)] font-mono">{label}</span>
      <div className="flex-1 min-w-0">
        {state.url ? (
          <div className="flex flex-col gap-1">
            {renderPreview(state.url)}
            <div className="flex items-center gap-2">
              {state.cached && <span className="text-[var(--ink-soft)]">cached</span>}
              <button type="button" onClick={onGenerate} disabled={state.busy} className="text-[var(--accent)] hover:underline disabled:opacity-50">
                regenerate
              </button>
            </div>
          </div>
        ) : state.busy ? (
          <span className="text-[var(--ink-soft)] italic">generating…</span>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            className="rounded border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white px-2 py-0.5 transition-colors"
          >
            generate
          </button>
        )}
        {state.error && (
          <p className="mt-1 text-red-700 dark:text-red-300 text-[10px] break-words">{state.error}</p>
        )}
      </div>
    </div>
  );
}
