-- Watch Tracking Tables Migration
-- Run in Supabase SQL Editor

-- ============================================================
-- 1. watch_entry — user's per-entry watch progress
-- ============================================================

create table public.watch_entry (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  franchise_id uuid not null references public.franchise(id) on delete cascade,
  entry_id uuid not null references public.entry(id) on delete cascade,
  episodes_watched integer not null default 0,
  status text not null default 'watching'
    check (status in ('watching', 'completed', 'dropped')),
  date_completed date,
  user_rating float,
  is_rewatch boolean not null default false,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_id)
);

-- Indexes
create index idx_watch_entry_user on public.watch_entry (user_id);
create index idx_watch_entry_franchise on public.watch_entry (user_id, franchise_id);

-- RLS
alter table public.watch_entry enable row level security;

create policy "Users can read own watch entries"
  on public.watch_entry for select
  using (auth.uid() = user_id);

create policy "Users can read public watch entries"
  on public.watch_entry for select
  using (is_public = true);

create policy "Users can insert own watch entries"
  on public.watch_entry for insert
  with check (auth.uid() = user_id);

create policy "Users can update own watch entries"
  on public.watch_entry for update
  using (auth.uid() = user_id);

create policy "Users can delete own watch entries"
  on public.watch_entry for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger watch_entry_updated_at
  before update on public.watch_entry
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 2. user_aura — per-type aura scores
-- ============================================================

create table public.user_aura (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  aura_type text not null
    check (aura_type in ('pioneer', 'scholar', 'oracle', 'sensei', 'veteran', 'archivist')),
  value integer not null default 0,
  last_calculated timestamptz not null default now(),
  unique (user_id, aura_type)
);

-- Indexes
create index idx_user_aura_user on public.user_aura (user_id);

-- RLS
alter table public.user_aura enable row level security;

create policy "Anyone can read user aura"
  on public.user_aura for select
  using (true);

create policy "Users can insert own aura"
  on public.user_aura for insert
  with check (auth.uid() = user_id);

create policy "Users can update own aura"
  on public.user_aura for update
  using (auth.uid() = user_id);

-- ============================================================
-- 3. activity — event log for feeds
-- ============================================================

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null
    check (type in ('watch_episode', 'complete_entry', 'start_watching', 'drop', 'rate')),
  franchise_id uuid references public.franchise(id) on delete cascade,
  entry_id uuid references public.entry(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_activity_user on public.activity (user_id, created_at desc);
create index idx_activity_franchise on public.activity (franchise_id, created_at desc);
create index idx_activity_created on public.activity (created_at desc);

-- RLS
alter table public.activity enable row level security;

create policy "Anyone can read activity"
  on public.activity for select
  using (true);

create policy "Users can insert own activity"
  on public.activity for insert
  with check (auth.uid() = user_id);
