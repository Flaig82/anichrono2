-- Discussion threads scoped to franchises
create table discussion (
  id uuid primary key default gen_random_uuid(),
  franchise_id uuid not null references franchise(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  title text not null,
  body text not null,
  reply_count integer not null default 0,
  last_reply_at timestamptz,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for listing discussions: pinned first, then by most recent reply/creation
create index idx_discussion_franchise_listing
  on discussion(franchise_id, is_pinned desc, last_reply_at desc nulls last, created_at desc);

-- RLS
alter table discussion enable row level security;

create policy "Anyone can read discussions"
  on discussion for select
  using (true);

create policy "Authenticated users can create discussions"
  on discussion for insert
  with check (auth.uid() = author_id);

-- Flat replies within a discussion
create table discussion_reply (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references discussion(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Index for listing replies chronologically
create index idx_discussion_reply_thread
  on discussion_reply(discussion_id, created_at asc);

-- RLS
alter table discussion_reply enable row level security;

create policy "Anyone can read replies"
  on discussion_reply for select
  using (true);

create policy "Authenticated users can create replies"
  on discussion_reply for insert
  with check (auth.uid() = author_id);
