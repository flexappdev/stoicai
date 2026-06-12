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
- [ ] PBI-3.5 Tasks mode: morning intention, evening review, premeditatio script, 7-day discipline plan (persona prompts handle these; UI shortcut buttons TBD)

## Phase 4 — Content sections

- [ ] PBI-4.1 `/wisdom` — filterable card grid (theme, virtue, context, author) + daily pick + share card
- [ ] PBI-4.2 `/stoics/[slug]` — profile pages with timeline, works, top items, portrait
- [ ] PBI-4.3 `/stoicism` — intro / intermediate / deep tracks rendered from `concept` + `exercise` items
- [ ] PBI-4.4 `/wisdom/[id]` — single-item permalink with citation + media slots + "generate now" buttons

## Phase 5 — Books reader + finish corpus

- [ ] PBI-5.1 `/books/[work-slug]` — chapter-paginated reader, inline "explain passage" agent prompt
- [ ] PBI-5.2 Ingest Letters 61–124 (~1,250 more items)
- [ ] PBI-5.3 Ingest Senecan essays (~1,000), Discourses (~2,000), Musonius (~300), Cicero (~600)
- [ ] PBI-5.4 Derived concepts (~250) + original exercises (~500) — agent-written, human-reviewed
- [ ] PBI-5.5 Smoke: `select count(*) from stoic_items` ≥ 10000

## Phase 6 — Media pipelines

- [ ] PBI-6.1 `/api/media/image` — Runware FLUX brand-card per `item_id`, upload `com27/stoicai/images/`
- [ ] PBI-6.2 `/api/media/audio` — Piper TTS per passage, upload `com27/stoicai/audio/`
- [ ] PBI-6.3 `/api/media/video` — Seedance loops + Remotion composition (via `/abc-videos`), upload `com27/stoicai/videos/`
- [ ] PBI-6.4 Per-item "Generate image / audio / video" buttons on `/wisdom/[id]` and `/books/[work]/[ch]`
- [ ] PBI-6.5 Browse pages `/images`, `/audio`, `/videos` paginated grids from `media` table

## Phase 7 — QA + ship

- [ ] PBI-7.1 `/abc-cleanup` — lint + unused-import sweep
- [ ] PBI-7.2 `vitest` smoke suite: llm.ts fallback chain, supabase ping, schema integrity
- [ ] PBI-7.3 `/abc-aa` — affiliate-link audit (book affiliate links on `/books`)
- [ ] PBI-7.4 `/abc-ga sync stoicai G-XXXX` — GA4 wired (env owed)
- [ ] PBI-7.5 `/abc-vercel set up vercel for stoicai` + env sync + `vercel --prod`
- [ ] PBI-7.6 Update registry `live_url` + `vercel_project_id`; update README prod link
- [ ] PBI-7.7 `/push` final

## Related — FSB cross-link (separate project)

- [ ] PBI-FSB.1 In `~/APPS/fsb`: wire `fsb_items` reads against `stoic_items.id` via shared Supabase
- [ ] PBI-FSB.2 Authoring loop continues at `~/APPS/fsb` per chapter template
