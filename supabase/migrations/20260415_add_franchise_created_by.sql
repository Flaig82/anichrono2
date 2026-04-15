-- Track who created each franchise. Nullable for legacy seed data (Pyrat).
alter table franchise add column if not exists created_by uuid references users(id);

-- Backfill: for non-seed franchises (created after March 20), use the user
-- who had the earliest activity on that franchise as a best guess.
update franchise f
set created_by = sub.user_id
from (
  select distinct on (a.franchise_id) a.franchise_id, a.user_id
  from activity a
  join franchise fr on fr.id = a.franchise_id
  where fr.created_at > '2026-03-20'
  order by a.franchise_id, a.created_at asc
) sub
where f.id = sub.franchise_id
  and f.created_by is null;
