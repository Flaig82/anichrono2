-- Add soft-delete column to entry table
-- Run this in the Supabase SQL Editor before deploying the code changes.

ALTER TABLE entry
  ADD COLUMN is_removed boolean NOT NULL DEFAULT false;

-- Index for filtering active entries by franchise
CREATE INDEX idx_entry_franchise_active
  ON entry (franchise_id, is_removed);
