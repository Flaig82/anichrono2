-- Tighten entry table RLS: only admins can insert/update directly.
-- All normal entry writes go through the service role (proposal apply + franchise create).

-- Drop the overly permissive policies
drop policy if exists "Authenticated users can insert entries" on public.entry;
drop policy if exists "Authenticated users can update entries" on public.entry;

-- Replace with admin-only write policies using the is_admin flag on the users table
create policy "Admins can insert entries"
  on public.entry for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.is_admin = true
    )
  );

create policy "Admins can update entries"
  on public.entry for update
  to authenticated
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
        and users.is_admin = true
    )
  );
