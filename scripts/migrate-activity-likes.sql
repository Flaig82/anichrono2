-- Activity likes table: supports likes on activity items, proposals, and franchises
create table activity_like (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('activity', 'proposal', 'franchise')),
  item_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(item_type, item_id, user_id)
);

-- Index for fast count + lookup queries
create index idx_activity_like_item on activity_like(item_type, item_id);
create index idx_activity_like_user on activity_like(user_id);

-- RLS policies
alter table activity_like enable row level security;

-- Anyone can read likes
create policy "activity_like_select" on activity_like
  for select using (true);

-- Authenticated users can insert their own likes
create policy "activity_like_insert" on activity_like
  for insert with check (auth.uid() = user_id);

-- Users can only delete their own likes
create policy "activity_like_delete" on activity_like
  for delete using (auth.uid() = user_id);
