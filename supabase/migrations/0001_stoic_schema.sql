-- StoicAI — initial schema
-- Tables: stoics, works, themes, stoic_items (+ pgvector embedding), media, daily_picks, fsb_items
-- RLS: public read on items/stoics/works/themes; service-role write everywhere.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ============================================================
-- 1. stoics
-- ============================================================
create table if not exists stoics (
  slug text primary key,
  name text not null,
  birth_year int,
  death_year int,
  era text,
  one_liner text,
  bio_short text,
  bio_long text,
  portrait_url text,
  wikipedia_url text,
  rank int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. works
-- ============================================================
create table if not exists works (
  slug text primary key,
  title text not null,
  author_slug text references stoics(slug) on delete restrict,
  original_language text,
  translator text,
  translation_year int,
  public_domain bool default true,
  gutenberg_id text,
  wikisource_url text,
  est_chunks int,
  rank int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. themes (taxonomy)
-- ============================================================
create table if not exists themes (
  slug text primary key,
  name text not null,
  description text
);

-- ============================================================
-- 4. stoic_items (the core 10K dataset)
-- ============================================================
do $$ begin
  create type stoic_item_type as enum (
    'quote','passage','concept','exercise','anecdote','letter','meditation','maxim','dichotomy','objection_response'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type stoic_virtue as enum ('wisdom','courage','justice','temperance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type stoic_difficulty as enum ('intro','intermediate','deep');
exception when duplicate_object then null; end $$;

create table if not exists stoic_items (
  id uuid primary key default uuid_generate_v4(),
  type stoic_item_type not null default 'passage',
  text text not null,
  text_modern text,
  author_slug text references stoics(slug) on delete set null,
  work_slug text references works(slug) on delete set null,
  source_ref text,
  translation text,
  themes text[] default '{}',
  virtue stoic_virtue,
  difficulty stoic_difficulty default 'intermediate',
  use_contexts text[] default '{}',
  image_id uuid,
  audio_id uuid,
  video_id uuid,
  quality_score smallint default 50,
  verified bool default false,
  stoic_adjacent bool default false,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists stoic_items_author_idx on stoic_items (author_slug);
create index if not exists stoic_items_work_idx on stoic_items (work_slug);
create index if not exists stoic_items_type_idx on stoic_items (type);
create index if not exists stoic_items_quality_idx on stoic_items (quality_score desc);
create index if not exists stoic_items_themes_idx on stoic_items using gin (themes);
create index if not exists stoic_items_contexts_idx on stoic_items using gin (use_contexts);
create index if not exists stoic_items_embedding_idx
  on stoic_items using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- 5. media (generated assets)
-- ============================================================
do $$ begin
  create type media_kind as enum ('image','audio','video');
exception when duplicate_object then null; end $$;

create table if not exists media (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid references stoic_items(id) on delete cascade,
  kind media_kind not null,
  s3_key text not null,
  public_url text,
  model text,
  prompt text,
  duration_ms int,
  width int,
  height int,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists media_item_kind_idx on media (item_id, kind);

-- ============================================================
-- 6. daily_picks
-- ============================================================
create table if not exists daily_picks (
  day date primary key,
  item_id uuid references stoic_items(id) on delete cascade,
  reason text,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. fsb_items (cross-link to Funny Stoic Book project)
-- ============================================================
create table if not exists fsb_items (
  id uuid primary key default uuid_generate_v4(),
  original_item_id uuid references stoic_items(id) on delete cascade,
  joke_text text not null,
  format text,
  illustration_id uuid,
  created_at timestamptz default now()
);

-- ============================================================
-- 8. RPC: similarity search
-- ============================================================
create or replace function match_stoic_items (
  query_embedding vector(1536),
  match_count int default 8,
  min_quality int default 0
)
returns table (
  id uuid,
  text text,
  author_slug text,
  source_ref text,
  themes text[],
  virtue stoic_virtue,
  quality_score smallint,
  similarity float
)
language sql stable as $$
  select
    si.id, si.text, si.author_slug, si.source_ref, si.themes, si.virtue, si.quality_score,
    1 - (si.embedding <=> query_embedding) as similarity
  from stoic_items si
  where si.embedding is not null
    and si.quality_score >= min_quality
  order by si.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================
-- 9. RLS
-- ============================================================
alter table stoics enable row level security;
alter table works enable row level security;
alter table themes enable row level security;
alter table stoic_items enable row level security;
alter table media enable row level security;
alter table daily_picks enable row level security;
alter table fsb_items enable row level security;

drop policy if exists "public read stoics" on stoics;
create policy "public read stoics" on stoics for select using (true);

drop policy if exists "public read works" on works;
create policy "public read works" on works for select using (true);

drop policy if exists "public read themes" on themes;
create policy "public read themes" on themes for select using (true);

drop policy if exists "public read items" on stoic_items;
create policy "public read items" on stoic_items for select using (true);

drop policy if exists "public read media" on media;
create policy "public read media" on media for select using (true);

drop policy if exists "public read daily_picks" on daily_picks;
create policy "public read daily_picks" on daily_picks for select using (true);

drop policy if exists "public read fsb" on fsb_items;
create policy "public read fsb" on fsb_items for select using (true);

-- service-role bypasses RLS by default; explicit writes happen via SUPABASE_SERVICE_ROLE_KEY.

-- ============================================================
-- 10. seed: the 8 named Stoics + 8 canonical works + theme taxonomy
-- ============================================================
insert into stoics (slug, name, birth_year, death_year, era, one_liner, rank) values
  ('zeno',       'Zeno of Citium',     -334, -262, 'early',  'Founder. Painted Porch.',            1),
  ('cleanthes',  'Cleanthes',          -330, -230, 'early',  'Second scholarch. Hymn to Zeus.',    2),
  ('chrysippus', 'Chrysippus',         -279, -206, 'early',  'Third scholarch. Systematizer.',     3),
  ('cato',       'Cato the Younger',    -95,  -46, 'roman',  'Stoic in deed; Roman conscience.',   4),
  ('seneca',     'Seneca the Younger',   -4,   65, 'roman',  'Letters; tutor to Nero.',            5),
  ('musonius',   'Musonius Rufus',       30,  101, 'roman',  'Teacher of Epictetus.',              6),
  ('epictetus',  'Epictetus',            50,  135, 'roman',  'Discourses. Enchiridion.',           7),
  ('marcus',     'Marcus Aurelius',     121,  180, 'roman',  'Emperor. Meditations.',              8)
on conflict (slug) do nothing;

insert into works (slug, title, author_slug, translator, translation_year, public_domain, est_chunks, rank) values
  ('meditations',         'Meditations',                          'marcus',     'George Long',    1862, true, 1200, 1),
  ('letters-lucilius',    'Letters to Lucilius',                  'seneca',     'R. M. Gummere',  1917, true, 2500, 2),
  ('senecan-essays',      'Essays (Shortness of Life, On Anger…)','seneca',     'Aubrey Stewart', 1900, true, 1000, 3),
  ('discourses',          'Discourses',                           'epictetus',  'George Long',    1890, true, 2000, 4),
  ('enchiridion',         'Enchiridion',                          'epictetus',  'T. W. Higginson',1865, true,  250, 5),
  ('musonius-lectures',   'Lectures',                             'musonius',   'Cora Lutz',      1947, true,  300, 6),
  ('lives-stoics',        'Lives of the Stoics',                  null,         'R. D. Hicks',    1925, true,  400, 7),
  ('cicero-tusculan',     'Tusculan Disputations + De Officiis',  null,         'C. D. Yonge',    1877, true,  600, 8)
on conflict (slug) do nothing;

insert into themes (slug, name, description) values
  ('adversity',  'Adversity',   'Hardship, obstacles, the test of character.'),
  ('death',      'Death',       'Mortality, memento mori, the brevity of life.'),
  ('anger',      'Anger',       'The destructive passion; cooling techniques.'),
  ('control',    'Control',     'The dichotomy: what is up to us and what is not.'),
  ('virtue',     'Virtue',      'The four cardinal virtues; the only true good.'),
  ('time',       'Time',        'Brevity, presentness, evening review.'),
  ('wealth',     'Wealth',      'External goods; preferred indifferents.'),
  ('friendship', 'Friendship',  'The wise friend; rare and precious.'),
  ('fame',       'Fame',        'Reputation, posterity, public opinion.'),
  ('anxiety',    'Anxiety',     'Future-tripping; premeditatio malorum.'),
  ('discipline', 'Discipline',  'Habit, training (askēsis), daily practice.'),
  ('judgment',   'Judgment',    'Impressions, assent, prokope.')
on conflict (slug) do nothing;
