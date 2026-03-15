-- Franchise-level watchlist table
-- Allows users to bookmark entire franchises and track status independently of entry-level watch_entry rows.
-- Progress is computed by joining with watch_entry + entry tables.

CREATE TABLE franchise_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  franchise_id uuid NOT NULL REFERENCES franchise(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'plan_to_watch',
  -- status: 'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped'
  added_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, franchise_id)
);

-- Index for efficient lookups
CREATE INDEX idx_franchise_watchlist_user ON franchise_watchlist (user_id);
CREATE INDEX idx_franchise_watchlist_user_status ON franchise_watchlist (user_id, status);

ALTER TABLE franchise_watchlist ENABLE ROW LEVEL SECURITY;

-- Users can manage their own watchlist
CREATE POLICY "Users can view own watchlist" ON franchise_watchlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlist" ON franchise_watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist" ON franchise_watchlist
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist" ON franchise_watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- Public read for profile watchlist views (privacy enforced at API layer)
CREATE POLICY "Public can view watchlists" ON franchise_watchlist
  FOR SELECT USING (true);

-- Add 'add_to_watchlist' to the activity type check constraint
ALTER TABLE activity DROP CONSTRAINT IF EXISTS activity_type_check;
ALTER TABLE activity ADD CONSTRAINT activity_type_check
  CHECK (type IN ('watch_episode', 'complete_entry', 'start_watching', 'drop', 'rate', 'submit_proposal', 'apply_proposal', 'review', 'add_to_watchlist'));
