-- Create franchise + entry tables for AURA
-- Run this in the Supabase SQL Editor

-- ============================================
-- FRANCHISE TABLE
-- ============================================
create table public.franchise (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  genres text[] default '{}',
  year_started integer,
  studio text,
  anilist_id integer,
  mal_id integer,
  obscurity_score float,
  obscurity_tier text check (obscurity_tier in ('mainstream', 'popular', 'cult', 'obscure')),
  status text check (status in ('finished', 'releasing', 'not_yet_released')) default 'releasing',
  cover_image_url text,
  banner_image_url text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- ENTRY TABLE
-- ============================================
create table public.entry (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references public.franchise(id) on delete cascade,
  position integer not null,
  title text not null,
  entry_type text not null check (entry_type in ('episodes', 'movie', 'ova', 'ona', 'manga', 'special')),
  episode_start integer,
  episode_end integer,
  parent_series text,
  anilist_id integer,
  is_essential boolean default true,
  curator_note text,
  created_at timestamptz default now()
);

-- Index for fast entry lookups by franchise
create index idx_entry_franchise_id on public.entry(franchise_id);
create index idx_entry_position on public.entry(franchise_id, position);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Franchise: public read, no public write
alter table public.franchise enable row level security;

create policy "Franchises are publicly readable"
  on public.franchise for select
  using (true);

-- Entry: public read, authenticated insert/update (for future community editing)
alter table public.entry enable row level security;

create policy "Entries are publicly readable"
  on public.entry for select
  using (true);

create policy "Authenticated users can insert entries"
  on public.entry for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update entries"
  on public.entry for update
  to authenticated
  using (true)
  with check (true);

-- ============================================
-- UPDATED_AT TRIGGER (franchise only)
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_franchise_updated_at
  before update on public.franchise
  for each row
  execute function public.handle_updated_at();

-- ============================================
-- ENTRY → FRANCHISE UPDATED_AT PROPAGATION
-- ============================================
-- Bumps franchise.updated_at whenever entries are added, changed, or removed
create or replace function public.handle_entry_touch_franchise()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    update public.franchise set updated_at = now() where id = old.franchise_id;
    return old;
  else
    update public.franchise set updated_at = now() where id = new.franchise_id;
    return new;
  end if;
end;
$$ language plpgsql;

create trigger entry_touch_franchise
  after insert or update or delete on public.entry
  for each row
  execute function public.handle_entry_touch_franchise();
