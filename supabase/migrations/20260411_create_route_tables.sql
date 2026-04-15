-- Route system (user-facing label: "Chronicle") — see CLAUDE.md naming note.
-- A `route` is an ordered subset of a franchise's master entries, curated by
-- a community member as an opinionated watch path (Newcomer, Completionist,
-- Chronological, or Manga Reader). Entry ordering is stored as a uuid[] to
-- preserve position without a join table.

-- =============================================================================
-- route: the entity
-- =============================================================================
create table if not exists route (
  id              uuid primary key default gen_random_uuid(),
  franchise_id    uuid not null references franchise(id) on delete cascade,
  author_id       uuid not null references users(id) on delete cascade,
  title           text not null,
  route_type      text not null
    check (route_type in ('newcomer', 'completionist', 'chronological', 'manga_reader')),
  entry_ids       uuid[] not null,
  summary         text,
  status          text not null default 'in_review'
    check (status in ('draft', 'in_review', 'approved', 'canon')),
  vote_count      integer not null default 0,
  follower_count  integer not null default 0,
  is_canon        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_route_franchise on route (franchise_id);
create index if not exists idx_route_author on route (author_id);
create index if not exists idx_route_status_approved
  on route (franchise_id)
  where status in ('approved', 'canon');

-- =============================================================================
-- route_vote: -1 / 1 upvote-downvote per (route, user)
-- =============================================================================
create table if not exists route_vote (
  route_id    uuid not null references route(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  value       smallint not null check (value in (-1, 1)),
  created_at  timestamptz not null default now(),
  primary key (route_id, user_id)
);

create index if not exists idx_route_vote_user on route_vote (user_id);

-- Denormalized vote_count trigger: keeps route.vote_count in sync with the
-- sum of values in route_vote. Avoids expensive aggregation on read.
create or replace function sync_route_vote_count()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update route
      set vote_count = vote_count + new.value,
          updated_at = now()
      where id = new.route_id;
  elsif tg_op = 'UPDATE' then
    update route
      set vote_count = vote_count + (new.value - old.value),
          updated_at = now()
      where id = new.route_id;
  elsif tg_op = 'DELETE' then
    update route
      set vote_count = vote_count - old.value,
          updated_at = now()
      where id = old.route_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_route_vote_count on route_vote;
create trigger trg_route_vote_count
  after insert or update or delete on route_vote
  for each row execute function sync_route_vote_count();

-- =============================================================================
-- route_follow: a user bookmarks a route to watch
-- =============================================================================
create table if not exists route_follow (
  route_id    uuid not null references route(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (route_id, user_id)
);

create index if not exists idx_route_follow_user on route_follow (user_id);

-- follower_count trigger
create or replace function sync_route_follower_count()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update route
      set follower_count = follower_count + 1,
          updated_at = now()
      where id = new.route_id;
  elsif tg_op = 'DELETE' then
    update route
      set follower_count = follower_count - 1,
          updated_at = now()
      where id = old.route_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_route_follower_count on route_follow;
create trigger trg_route_follower_count
  after insert or delete on route_follow
  for each row execute function sync_route_follower_count();

-- =============================================================================
-- route_progress: per-user watch progress through a followed route
-- =============================================================================
create table if not exists route_progress (
  id                 uuid primary key default gen_random_uuid(),
  route_id           uuid not null references route(id) on delete cascade,
  user_id            uuid not null references users(id) on delete cascade,
  current_position   integer not null default 0,
  entries_completed  uuid[] not null default '{}',
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  unique (route_id, user_id)
);

create index if not exists idx_route_progress_user on route_progress (user_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table route enable row level security;
alter table route_vote enable row level security;
alter table route_follow enable row level security;
alter table route_progress enable row level security;

-- route: anyone can read approved / canon routes, authors can read their own drafts
create policy "Public read approved routes"
  on route for select
  using (status in ('approved', 'canon'));

create policy "Authors read own drafts"
  on route for select
  using (auth.uid() = author_id);

create policy "Auth users create routes"
  on route for insert
  with check (auth.uid() = author_id);

create policy "Authors update own routes"
  on route for update
  using (auth.uid() = author_id);

create policy "Authors delete own routes"
  on route for delete
  using (auth.uid() = author_id);

-- route_vote: public read, auth write-own
create policy "Anyone can read route votes"
  on route_vote for select
  using (true);

create policy "Auth users vote on routes"
  on route_vote for insert
  with check (auth.uid() = user_id);

create policy "Users change own route vote"
  on route_vote for update
  using (auth.uid() = user_id);

create policy "Users delete own route vote"
  on route_vote for delete
  using (auth.uid() = user_id);

-- route_follow: public read (for follower_count display), auth write-own
create policy "Anyone can read route follows"
  on route_follow for select
  using (true);

create policy "Auth users follow routes"
  on route_follow for insert
  with check (auth.uid() = user_id);

create policy "Users unfollow own routes"
  on route_follow for delete
  using (auth.uid() = user_id);

-- route_progress: private to owning user
create policy "Users read own route progress"
  on route_progress for select
  using (auth.uid() = user_id);

create policy "Users create own route progress"
  on route_progress for insert
  with check (auth.uid() = user_id);

create policy "Users update own route progress"
  on route_progress for update
  using (auth.uid() = user_id);

create policy "Users delete own route progress"
  on route_progress for delete
  using (auth.uid() = user_id);
