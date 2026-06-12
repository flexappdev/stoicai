# StoicAI Backlog

Phase 0 is shipped in v0.1. Phases 1–7 run via `/loop` after the first push.

## Phase 1 — Ingest (target: 5K items)

- [x] PBI-1.1 `scripts/ingest/gutenberg.ts` — fetch Gutenberg by gutenberg_id, strip headers/footers
- [x] PBI-1.2 `scripts/ingest/chunker.ts` — passage-aware chunker (numbered passages, NOT token-naive) — Enchiridion 62 chunks, Meditations 479 chunks via smoke harness
- [ ] PBI-1.3 `scripts/ingest/meditations.ts` — load 12 books × ~100 passages → `stoic_items`
- [ ] PBI-1.4 `scripts/ingest/enchiridion.ts` — 53 chapters, sub-chunked where needed
- [ ] PBI-1.5 `scripts/ingest/letters-lucilius.ts` — Letters 1–60 (~1,250 items), Gummere translation
- [ ] PBI-1.6 Insert with `verified=false`, `quality_score=50` default, `embedding=null`
- [ ] PBI-1.7 Smoke: `select count(*) from stoic_items` ≥ 5000

## Phase 2 — Enrichment + embedding

- [ ] PBI-2.1 `scripts/enrich.ts` — per-item Claude batch: themes, virtue, difficulty, use_contexts, quality_score
- [ ] PBI-2.2 `scripts/paraphrase.ts` — `text_modern` for top-1000 quality-scored items
- [ ] PBI-2.3 `scripts/embed.ts` — OpenAI text-embedding-3-small (1536d) → `stoic_items.embedding`
- [ ] PBI-2.4 Verification pass on 10% sample (source-checked); `verified=true` flag
- [ ] PBI-2.5 `match_stoic_items()` RPC smoke: top-8 for "anger" query returns Senecan items

## Phase 3 — Agent v1

- [ ] PBI-3.1 `/api/agent/chat` route: persona system prompt + retrieval over `stoic_items` (top-8) + citation rules
- [ ] PBI-3.2 Tools: `search_wisdom(query, theme, author)`, `daily_stoic()`, `create_exercise(situation)`
- [ ] PBI-3.3 `/` agent page UI: chat panel + tasks panel + OpenRouter model selector dropdown (4 tiers)
- [ ] PBI-3.4 Guardrails: never invent quotes, crisis-language deflection + resources
- [ ] PBI-3.5 Tasks mode: morning intention, evening review, premeditatio script, 7-day discipline plan

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
