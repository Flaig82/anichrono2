-- Add 'anilist_import' to the activity type check constraint
ALTER TABLE activity DROP CONSTRAINT IF EXISTS activity_type_check;
ALTER TABLE activity ADD CONSTRAINT activity_type_check
  CHECK (type IN ('watch_episode', 'complete_entry', 'start_watching', 'drop', 'rate', 'submit_proposal', 'apply_proposal', 'review', 'add_to_watchlist', 'anilist_import'));
