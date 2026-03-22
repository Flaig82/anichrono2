-- Admin notes: internal communication between admins
create table admin_notes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table admin_notes enable row level security;

-- Only service role (admin API routes) can access
create policy "Service role full access" on admin_notes
  for all using (true) with check (true);
