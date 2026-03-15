-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_watchlist_public boolean DEFAULT true;
