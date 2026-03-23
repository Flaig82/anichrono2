-- Add to-do list columns to admin_notes table
ALTER TABLE admin_notes
  ADD COLUMN is_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN completed_at timestamptz,
  ADD COLUMN completed_by uuid REFERENCES public.users(id);
