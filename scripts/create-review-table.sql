-- Review Table Migration
-- Run in Supabase SQL Editor

-- ============================================================
-- 1. review — user reviews on franchises
-- ============================================================

create table public.review (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  franchise_id uuid not null references public.franchise(id) on delete cascade,
  body text not null,
  score float not null check (score >= 1 and score <= 10),
  word_count integer not null default 0,
  upvotes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, franchise_id)
);

-- Indexes
create index idx_review_franchise on public.review (franchise_id, created_at desc);
create index idx_review_user on public.review (user_id);

-- RLS
alter table public.review enable row level security;

create policy "Anyone can read reviews"
  on public.review for select
  using (true);

create policy "Users can insert own reviews"
  on public.review for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.review for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.review for delete
  using (auth.uid() = user_id);

-- updated_at trigger (reuses set_updated_at from watch tables)
create trigger review_updated_at
  before update on public.review
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- 2. Add 'review' to activity type check constraint
-- ============================================================

alter table public.activity
  drop constraint if exists activity_type_check;

alter table public.activity
  add constraint activity_type_check
  check (type in ('watch_episode', 'complete_entry', 'start_watching', 'drop', 'rate', 'submit_proposal', 'apply_proposal', 'review'));
