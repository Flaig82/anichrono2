-- Draft / review bucket for franchises.
--
-- Auto-generated (and any staged) franchises land as 'draft' and stay hidden
-- from the public until an admin approves them on /admin/review. Existing and
-- manually-created franchises default to 'live' so nothing currently on the
-- site disappears.
--
-- Enforcement is at the RLS layer (one policy), NOT per-query: every public
-- read goes through the anon/cookie Supabase client, so a single SELECT policy
-- gates all 25+ read paths at once. Admin and cron reads use the service-role
-- client (createServiceClient), which bypasses RLS after an is_admin / CRON
-- secret check — so no admin exception is needed in the policy.

-- 1. Column ----------------------------------------------------------------
alter table public.franchise
  add column if not exists review_status text not null default 'live'
    check (review_status in ('draft', 'live', 'rejected'));

create index if not exists idx_franchise_review_status
  on public.franchise (review_status);

-- 2. RLS: public sees only live franchises ---------------------------------
-- Replaces the permissive "using (true)" SELECT policy.
drop policy if exists "Franchises are publicly readable" on public.franchise;

create policy "Public can read live franchises"
  on public.franchise for select
  using (review_status = 'live');
