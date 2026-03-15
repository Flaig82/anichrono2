-- Trigger: bump franchise.updated_at when entries are inserted, updated, or deleted
-- Run this in the Supabase SQL Editor

create or replace function public.handle_entry_touch_franchise()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    update public.franchise set updated_at = now() where id = old.franchise_id;
    return old;
  else
    update public.franchise set updated_at = now() where id = new.franchise_id;
    return new;
  end if;
end;
$$ language plpgsql;

create trigger entry_touch_franchise
  after insert or update or delete on public.entry
  for each row
  execute function public.handle_entry_touch_franchise();
