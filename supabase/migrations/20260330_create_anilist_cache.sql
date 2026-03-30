-- Cache table for AniList media data, synced via Vercel Cron.
-- Pages read from here instead of calling AniList directly (which returns 403 from Cloudflare WAF).

create table if not exists anilist_media_cache (
  anilist_id       integer primary key,
  title_english    text,
  title_romaji     text not null,
  cover_image_url  text,
  average_score    integer,
  popularity       integer,
  genres           text[] not null default '{}',
  season_year      integer,
  season           text,
  format           text,
  episodes         integer,
  status           text,
  related_ids      integer[] not null default '{}',
  synced_at        timestamptz not null default now()
);

create index if not exists idx_amc_popularity on anilist_media_cache (popularity desc);
create index if not exists idx_amc_score on anilist_media_cache (average_score desc);
create index if not exists idx_amc_season on anilist_media_cache (season, season_year);
create index if not exists idx_amc_format on anilist_media_cache (format);

alter table anilist_media_cache enable row level security;

create policy "Public read access"
  on anilist_media_cache for select
  using (true);

-- Ordered discover lists (trending, popular, niche, hidden).
-- Preserves the exact order AniList returned so pages render consistently.

create table if not exists anilist_discover_list (
  list_key     text primary key,
  anilist_ids  integer[] not null default '{}',
  synced_at    timestamptz not null default now()
);

alter table anilist_discover_list enable row level security;

create policy "Public read access"
  on anilist_discover_list for select
  using (true);
