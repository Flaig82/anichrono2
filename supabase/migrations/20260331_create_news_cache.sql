-- News cache: ANN RSS articles matched to franchises.
-- Synced every 2 hours via Vercel Cron, read by franchise page sidebar.

create table if not exists news_cache (
  id             text primary key,        -- ANN guid URL (unique per article)
  title          text not null,
  description    text,
  source_url     text not null,
  category       text,                    -- "Anime", "Manga", "Industry", "Live-Action"
  published_at   timestamptz not null,
  franchise_id   uuid references franchise(id) on delete set null,
  synced_at      timestamptz not null default now()
);

create index if not exists idx_nc_franchise on news_cache (franchise_id);
create index if not exists idx_nc_published on news_cache (published_at desc);

alter table news_cache enable row level security;

create policy "Public read access"
  on news_cache for select
  using (true);

-- Add aliases column to franchise for news headline matching.
-- e.g. ["Fullmetal Alchemist", "FMA", "Shingeki no Kyojin"]
alter table franchise add column if not exists aliases text[] not null default '{}';
