# StoicAI

> Ancient wisdom, AI-native. A Stoic mentor agent grounded in a 10,000-item curated corpus of Marcus Aurelius, Seneca, Epictetus, Musonius, and beyond — with on-demand image, audio, and video generation per passage.

- **Local**: http://localhost:17003
- **Prod**: https://stoicai-lqjbthjqa-matsiems.vercel.app · `vercel_project_id` `prj_3bt4OzqeQP4YLAfi5qnHhFOtOttM`
- **Repo**: https://github.com/flexappdev/stoicai
- **Stack**: Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (Postgres + pgvector + Auth) · OpenRouter (LLM router) · MongoDB Atlas (cache mirror) · S3 com27 (media) · Runware FLUX (images) · Piper TTS (audio) · Seedance + Remotion (video) · Vercel (deploy)
- **Port**: `17003` · **Accent**: `#006699` · **S3 prefix**: `com27/stoicai/` · **Fleet rank**: 32

## Why

One governed Stoic dataset powering many surfaces: a mentor agent (chat + structured tasks), a guide, a quote browser, a books reader, and a media pipeline. Every claim cites a public-domain source (`Meditations 4.7`, `Letters 13.4`). Zero licensing risk.

## App sections

| Path | Section | Status |
|---|---|---|
| `/` | **Agent** — chat + tasks panel | scaffolded · live in Phase 3 |
| `/stoicism` | **Stoicism** — the guide (intro / intermediate / deep) | scaffolded · live in Phase 4 |
| `/stoics` | **Stoics** — 8 philosopher profiles | scaffolded · live in Phase 4 |
| `/wisdom` | **Wisdom** — top quotes (filter by theme/virtue/context) | scaffolded · live in Phase 4 |
| `/books` | **Books** — canonical works, in-app reader | scaffolded · live in Phase 5 |
| `/images` | **Images** — generated quote cards + portraits | scaffolded · live in Phase 6 |
| `/audio` | **Audio** — TTS passages + daily meditation | scaffolded · live in Phase 6 |
| `/videos` | **Videos** — short-form wisdom clips | scaffolded · live in Phase 6 |
| `/api/health` | env + Supabase + LLM ping | live |

## The dataset (the moat)

The 10K target breaks down as:

| Source (public domain) | Items |
|---|---|
| Marcus Aurelius — *Meditations* (Long) | ~1,200 |
| Seneca — *Letters to Lucilius* (Gummere) | ~2,500 |
| Seneca — *Essays* (Shortness of Life, On Anger…) | ~1,000 |
| Epictetus — *Discourses* (Long) | ~2,000 |
| Epictetus — *Enchiridion* (Higginson) | ~250 |
| Musonius Rufus — *Lectures* | ~300 |
| Diogenes Laertius — *Lives of the Stoics* | ~400 |
| Cicero — *Tusculan Disputations*, *De Officiis* (stoic-adjacent) | ~600 |
| Derived concepts (dichotomy of control, amor fati, memento mori, premeditatio…) | ~250 |
| Original exercises (journaling, premeditatio scripts, evening reviews) | ~500 |
| Modern paraphrases of top-scored quotes | ~1,000 |

Schema in [`supabase/migrations/0001_stoic_schema.sql`](supabase/migrations/0001_stoic_schema.sql) — `stoics`, `works`, `themes`, `stoic_items` (with `embedding vector(1536)`), `media`, `daily_picks`, `fsb_items`. Similarity search via `match_stoic_items()` RPC.

## Quick start

```bash
cd ~/APPS/stoicai
npm install
# .env.local already wired from ~/context-2026/agents/.env
npm run dev    # → http://localhost:17003
```

Health: `curl http://localhost:17003/api/health` returns env presence, Supabase ping, LLM ping.

To apply the schema to Supabase, run the migration in `supabase/migrations/0001_stoic_schema.sql` via the SQL editor in the Supabase Studio dashboard (or `supabase db push` once linked).

## Build phases

- **Phase 0** ✅ — Next 16 scaffold, registry entries, Supabase schema, 8-section app shell, OpenRouter client, health route
- **Phase 1** — Ingest pipeline + first 5K items (Meditations + Enchiridion + Letters 1–60)
- **Phase 2** — Claude enrichment batch (themes, virtue, modern paraphrase, quality_score) + pgvector embeddings
- **Phase 3** — Agent v1: chat + tasks panel with RAG citations + OpenRouter model selector
- **Phase 4** — Wisdom + Stoics + Stoicism content sections live
- **Phase 5** — Books reader + remaining 5K items (to 10K target)
- **Phase 6** — On-demand media: Runware FLUX (images), Piper TTS (audio), Seedance + Remotion (videos) — per-item generate buttons
- **Phase 7** — QA: `/abc-cleanup`, vitest smoke, `/abc-aa` link audit, `/abc-ga` GA4 sync, `/abc-vercel` deploy, README + registry update

See [`BACKLOG.md`](BACKLOG.md) for the full PBI list.

## OpenRouter model selector

`src/lib/llm.ts` exposes a unified `llmCall({ tier, model, ... })` over OpenRouter with 4 tiers:

- `premium`  → `anthropic/claude-sonnet-4-6` → `openai/gpt-4o`
- `balanced` → `anthropic/claude-sonnet-4-6` → `openai/gpt-4o-mini` *(default)*
- `fast`     → `openai/gpt-4o-mini` → `anthropic/claude-haiku-4-5`
- `free`     → `anthropic/claude-sonnet-4-6` → llama-70b:free → gemma-9b:free

Paid model first in every chain — free models 429 under any real load.

## Related projects

- **FSB** (`~/APPS/fsb` — Funny Stoic Book) reads the same dataset via the `fsb_items` cross-link table. Stoicism delivered through humor; every joke anchors to a real cited passage.
- **Cockpit** (`~/APPS/appai`) — fleet orchestrator that watches build/preview/push/deploy across all 30 repos.

## License

Code MIT. Stoic corpus public domain (Gutenberg / Wikisource).
