-- Rename 'veteran' aura type to 'aura' in user_aura table
-- Run in Supabase SQL Editor

-- 1. Drop the old constraint first (it doesn't allow 'aura')
alter table public.user_aura
  drop constraint if exists user_aura_aura_type_check;

-- 2. Update any remaining 'veteran' rows
update public.user_aura
set aura_type = 'aura'
where aura_type = 'veteran';

-- 3. Add the new constraint
alter table public.user_aura
  add constraint user_aura_aura_type_check
  check (aura_type in ('pioneer', 'scholar', 'oracle', 'sensei', 'aura', 'archivist'));
