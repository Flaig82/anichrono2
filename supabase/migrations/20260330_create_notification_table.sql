-- Notification table
create table notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  actor_id uuid references users(id) on delete set null,
  entity_type text,
  entity_id text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for fetching user notifications ordered by time
create index idx_notification_user_created on notification(user_id, created_at desc);

-- Index for unread count badge
create index idx_notification_user_unread on notification(user_id) where read = false;

-- Index for deduplication lookups (e.g. preventing duplicate like notifications)
create index idx_notification_entity_type on notification(entity_type, entity_id, type);

-- RLS policies
alter table notification enable row level security;

-- Users can read their own notifications
create policy "Users can read own notifications"
  on notification for select
  using (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
create policy "Users can update own notifications"
  on notification for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only service_role can insert notifications (via server-side helpers)
create policy "Service role can insert notifications"
  on notification for insert
  with check (true);
