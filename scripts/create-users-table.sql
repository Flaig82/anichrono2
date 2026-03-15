-- ============================================
-- AURA: public.users table + RLS + triggers
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================

-- 1. Create the public.users table
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  handle text unique,
  avatar_url text,
  auth_provider text not null default 'email' check (auth_provider in ('email', 'google', 'discord')),
  era text not null default 'initiate' check (era in ('initiate', 'wanderer', 'adept', 'ascendant')),
  dominant_aura_type text check (dominant_aura_type in ('pioneer', 'scholar', 'oracle', 'sensei', 'veteran', 'archivist')),
  total_aura integer not null default 0,
  anilist_username text,
  mal_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.users enable row level security;

-- 3. Policies
create policy "Users are publicly readable"
  on public.users for select
  using (true);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- No delete policy — users cannot delete their own profile

-- 4. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, display_name, avatar_url, auth_provider)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    case
      when new.raw_app_meta_data ->> 'provider' = 'google' then 'google'
      when new.raw_app_meta_data ->> 'provider' = 'discord' then 'discord'
      else 'email'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_users_updated
  before update on public.users
  for each row execute function public.update_updated_at();
