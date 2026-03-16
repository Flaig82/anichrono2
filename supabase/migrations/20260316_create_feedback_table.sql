-- Feedback submissions from the contact form
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Allow anonymous inserts (no auth required for feedback)
alter table public.feedback enable row level security;

create policy "Anyone can insert feedback"
  on public.feedback
  for insert
  with check (true);

-- Only service role can read feedback (admin access)
create policy "Service role can read feedback"
  on public.feedback
  for select
  using (auth.role() = 'service_role');
