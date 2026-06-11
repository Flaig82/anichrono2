-- Durable record of cron sync runs (success and failure), so cache health is
-- queryable and surfaced on the admin dashboard. Written by crons via the
-- service-role client (bypasses RLS); readable only by admins.

create table if not exists sync_log (
  id        uuid primary key default gen_random_uuid(),
  job       text not null,
  ok        boolean not null,
  synced    integer not null default 0,
  warnings  text[] not null default '{}',
  error     text,
  ran_at    timestamptz not null default now()
);

create index if not exists idx_sync_log_job_ran on sync_log (job, ran_at desc);

alter table sync_log enable row level security;

create policy "Admin read access"
  on sync_log for select
  using (exists (select 1 from users where users.id = auth.uid() and users.is_admin));
