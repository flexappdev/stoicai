# StoicAI Backlog

Phase 0 is shipped in v0.1. Phases 1–7 run via `/loop` after the first push.

## Phase 1 — Ingest (target: 5K items)

- [x] PBI-1.1 `scripts/ingest/gutenberg.ts` — fetch Gutenberg by gutenberg_id, strip headers/footers
- [x] PBI-1.2 `scripts/ingest/chunker.ts` — passage-aware chunker (numbered passages, NOT token-naive) — Enchiridion 62 chunks, Meditations 479 chunks via smoke harness
- [x] PBI-1.3 `scripts/ingest/meditations.ts` — Marcus Aurelius / George Long → 479 dry-run items
- [x] PBI-1.4 `scripts/ingest/enchiridion.ts` — Epictetus / Higginson → 62 dry-run items
- [~] PBI-1.5 `scripts/ingest/letters-lucilius.ts` — Letters 1–60 (~1,250 items), Gummere translation. **Source pivot needed**: Letters to Lucilius (Gummere) is NOT on Project Gutenberg (confirmed against PG author #1308). It lives on Wikisource at `https://en.wikisource.org/wiki/Moral_letters_to_Lucilius` — page-per-letter. Defer until a Wikisource fetcher is written; can fall back to PG#56075 (Seneca's *Morals of a Happy Life, Benefits, Anger, Clemency* by L'Estrange) for ~1,000 Senecan items in the meantime as Phase 5.3.
- [~] PBI-1.6 Insert path — `db.ts` admin client + `upsertItems()` + `seed.ts` ready; **blocked by migration 0001 not applied to prod Supabase project** (all 7 tables missing — apply via Studio SQL editor)
- [ ] PBI-1.7 Smoke: `select count(*) from stoic_items` ≥ 5000 (blocked by PBI-1.6 above)

## Phase 2 — Enrichment + embedding

- [x] PBI-2.1 `scripts/enrich.ts` — Claude batch enricher: themes, virtue, difficulty, use_contexts, quality_score (0..100). Strict-taxonomy validation, JSON output, dry-run mode against JSON input or DB mode against unenriched stoic_items rows. Smoke: 6 Meditations Book 1 items enriched with valid taxonomy in 2 batches; calibration sane (list-of-relations passages correctly flagged q=38–42, intro difficulty).
- [x] PBI-2.2 `scripts/paraphrase.ts` — `text_modern` for top-quality items (≥70 by default). LLM modernizer with strict "preserve argument, drop pseudo-classical register" prompt. JSON array output, dry-run + DB modes. Smoke: 3 Meditations Book 1 items modernized cleanly ("Of my grandfather Verus I have learned…" → "From my grandfather Verus I learned…").
- [~] PBI-2.3 `scripts/embed.ts` — OpenAI text-embedding-3-small (1536d) → `stoic_items.embedding`. Code complete, batches 100/req, dry-run + DB modes, idempotent. **Blocked by**: OPENAI_API_KEY not in `~/context-2026/agents/.env` (OpenRouter doesn't proxy embeddings — needs direct OpenAI access). Surfaces a clean error message until the key is added.
- [ ] PBI-2.4 Verification pass on 10% sample (source-checked); `verified=true` flag
- [ ] PBI-2.5 `match_stoic_items()` RPC smoke: top-8 for "anger" query returns Senecan items

## Phase 3 — Agent v1

- [x] PBI-3.1 `/api/agent/chat` route: Stoic mentor persona + ilike-keyword retrieval over `stoic_items` (top-6) + citation block. Degrades gracefully when corpus is empty (no fabricated citations). Embedding-based vector retrieval upgrades to RPC `match_stoic_items()` once Phase 2 embeddings are populated.
- [ ] PBI-3.2 Tools: `search_wisdom(query, theme, author)`, `daily_stoic()`, `create_exercise(situation)` — promote keyword retrieval into explicit tool-calls
- [x] PBI-3.3 `/` agent page UI: 4-tier model selector dropdown + RAG toggle + starter prompts + scrollable chat area
- [x] PBI-3.4 Guardrails: never invent quotes baked into `src/lib/persona.ts` system prompt; crisis-language deflection to Samaritans / 988
- [x] PBI-3.5 Tasks mode: 4 shortcut buttons on the AgentChat header bar (Morning intention / Evening review / Premeditatio / 7-day plan), each sends a pre-curated mentor prompt that drives the structured Stoic exercise. Tooltip hint per button. Smoke: home page returns all 4 button labels in SSR.

## Phase 4 — Content sections

- [x] PBI-4.1 `/wisdom` — 30 hand-picked top-quality Stoic passages with multi-axis filter (12 themes, 4 virtues, 4 authors, 7 contexts) + sort (quality / random) + per-card copy-to-clipboard + deterministic daily pick (FNV-1a hash of UTC date) + `?theme=control` deep-linking from /stoics theme chips. Filter state lives in WisdomGrid client component; data lives in `src/lib/wisdom-data.ts` mirroring StoicItemInsert shape for the DB swap. Smoke: HTTP 200 on `/wisdom` and `/wisdom?theme=control`; daily-pick block renders inline.
- [x] PBI-4.2 `/stoics/[slug]` — 8 SSG profile pages with timeline (formatYears BCE/CE), curated bio paragraph, linked works list, per-Stoic theme chips, prev/next nav. Sourced from `src/lib/stoics-data.ts` (single source of truth mirroring `seed.ts`); swap to Supabase query once migration applied. Top-passages section is a placeholder until Phase 1.6 ingest writes rows. Smoke: all 8 routes return HTTP 200 with per-Stoic <title> metadata, nonexistent slug correctly returns 404.
- [x] PBI-4.3 `/stoicism` guide: 12 curated concepts × 3 tracks (intro / intermediate / deep). Routes: `/stoicism` index, `/stoicism/[track]`, `/stoicism/concept/[slug]`. All SSG via generateStaticParams; per-concept Greek term, body paragraph, associated Stoics (cross-links to `/stoics/[slug]`), see-also (cross-links to other concepts), mentor CTA. Smoke: 7 routes return HTTP 200, 2 bogus paths return 404. Concepts: dichotomy-of-control, four-virtues, memento-mori, premeditatio-malorum, evening-review, amor-fati, preferred-indifferents, prokope, view-from-above, logos, oikeiosis, impressions-and-assent. DB swap once `stoic_items.type='concept'` rows are populated.
- [ ] PBI-4.4 `/wisdom/[id]` — single-item permalink with citation + media slots + "generate now" buttons

## Phase 5 — Books reader + finish corpus

- [x] PBI-5.1 `/books/[slug]` reader. Live Gutenberg fetch + 7-day disk cache at `/tmp/stoicai-books/` (configurable via `STOICAI_BOOK_CACHE_DIR`); passage-aware chunker per work; paginated 10 chapters per `?ch=N`; book-group headings (Meditations / Discourses); per-passage ref displayed (`Meditations 4.7`); mentor CTA; Project Gutenberg back-link. 5 works wired (Meditations, Enchiridion, Discourses, Senecan Essays, Cicero Tusculan); 3 works (Letters-Lucilius, Musonius Lectures, Lives of the Stoics) render with a "source pivot needed" stub linking to Wikisource where applicable. Smoke: all 6 routes 200 with per-book metadata.
- [ ] PBI-5.2 Ingest Letters 61–124 (~1,250 more items)
- [ ] PBI-5.3 Ingest Senecan essays (~1,000), Discourses (~2,000), Musonius (~300), Cicero (~600)
- [ ] PBI-5.4 Derived concepts (~250) + original exercises (~500) — agent-written, human-reviewed
- [ ] PBI-5.5 Smoke: `select count(*) from stoic_items` ≥ 10000

## Phase 6 — Media pipelines

- [x] PBI-6.1 `/api/media/image` — Runware FLUX (hard-pinned `runware:100@1`, NOT the central-env default which is Seedance video) → S3 com27 mirror at `stoicai/images/<item_id>.jpg`. Brand-card prompt embeds parchment-and-ink palette + #006699 accent + "no text" guard (FLUX can't render text well). POST + GET probe. 1024×1024 JPEG, ~166KB, ~2.5s generation. Idempotent cache via S3 HEAD. **One follow-up**: com27 bucket policy needs a PublicReadStoicAI statement (same pattern as PublicReadXmas) before the S3 mirror serves publicly — Runware CDN URL works in the meantime. Smoke: end-to-end POST returned HTTP 200 with both runware_url and image_url; PUT to com27 succeeded (verified via direct re-fetch).
- [~] PBI-6.2 `/api/media/audio` — OpenAI TTS-1 (default voice `onyx`, Senecan-mentor register) → S3 com27 mirror at `stoicai/audio/<item_id>.mp3`. POST + GET probe, idempotent cache, 4000-char single-call cap surfaces clearly. Pivoted from Piper (local-only, weighs ~200MB and runs on CPU) to OpenAI TTS-1 — same OPENAI_API_KEY unlock as embed. Smoke: GET probe returns `tts_ready: false` until key added; POST returns HTTP 503 with clean message. Activates the moment OPENAI_API_KEY lands (task #20).
- [x] PBI-6.3 `/api/media/video` — Runware Seedance (`bytedance:2@2`) async videoInference + getResponse polling (5s tick, 120s timeout), 720×1280 9:16 vertical, 5s default, ambient-prompt template (marble bust + candlelight + dust + #006699 tone, no text). S3 mirror at `stoicai/videos/<item_id>.mp4`. Spend gate: 402 unless `confirm: true` (cached responses bypass). Route compiles + smoke verified GET probe + POST gate. Remotion composition for tentpole items deferred to a later pass — current single-clip generation is sufficient for daily share clips.
- [x] PBI-6.4 Per-card MediaActions panel on `/wisdom` — lazy-open ("+ media"), then probes `/api/media/{image,audio,video}?item_id=...` for cached assets, surfaces 3 generate buttons with inline previews (img / `<audio controls>` / `<video controls>`). Image generation 1-click; video shows a confirm() dialog disclosing $0.25/30-60s cost before POSTing with `confirm: true`. Cached responses auto-load on panel open. Smoke: /wisdom HTTP 200 with 30 `+ media` buttons SSR-rendered (one per card).
- [x] PBI-6.5 Browse pages `/images`, `/audio`, `/videos` — live S3 ListObjectsV2 over `com27/stoicai/<kind>/` cross-joined with WISDOM by item_id. Renders grid (images), audio list with inline `<audio controls>` + quote, video grid with `<video controls>` 9:16 cards. force-dynamic + revalidate=0 so each visit shows the latest. Empty-state CTAs link back to /wisdom. Smoke: HTTP 200 all three; /images already shows `ench-1` from the earlier generation (visible via the S3 listing even though public reads are still gated by task #21).

## Phase 7 — QA + ship

- [x] PBI-7.1 lint sweep — fixed 4 errors + 1 warning in scripts/enrich.ts, scripts/ingest/chunker.ts, src/app/books/[slug]/page.tsx, src/app/stoicism/concept/[slug]/page.tsx, src/app/wisdom/page.tsx (prefer-const + unescaped-entities + no-unused-vars). `npm run lint` exits 0.
- [x] PBI-7.2 vitest smoke harness — 18/18 green across 3 suites: tests/chunker.test.ts (5 cases against Meditations BOOK + Enchiridion + paragraph fallback + minLen filter), tests/llm.test.ts (regex-checks llm.ts tier table so the AIOS gotcha can never regress — paid claude-sonnet-4-6 must lead every chain, especially "free"), tests/data.test.ts (13 cases — stoics chronology, FK consistency between WORKS↔STOICS, formatYears BCE/CE, concepts see_also + associated_stoics resolve, wisdom taxonomy validation, dailyPick determinism). npm scripts: `test` + `test:watch`.
- [ ] PBI-7.3 `/abc-aa` — affiliate-link audit (book affiliate links on `/books`)
- [ ] PBI-7.4 `/abc-ga sync stoicai G-XXXX` — GA4 wired (env owed)
- [ ] PBI-7.5 `/abc-vercel set up vercel for stoicai` + env sync + `vercel --prod`
- [ ] PBI-7.6 Update registry `live_url` + `vercel_project_id`; update README prod link
- [ ] PBI-7.7 `/push` final

## Related — FSB cross-link (separate project)

- [ ] PBI-FSB.1 In `~/APPS/fsb`: wire `fsb_items` reads against `stoic_items.id` via shared Supabase
- [ ] PBI-FSB.2 Authoring loop continues at `~/APPS/fsb` per chapter template
