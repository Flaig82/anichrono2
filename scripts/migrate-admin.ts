/**
 * Migration: Admin approval queue for proposals
 *
 * Run this SQL in Supabase SQL Editor or via supabase migration:
 *
 * 1. Add is_admin column to users
 * 2. Update order_proposal status CHECK constraint to include 'pending_approval'
 * 3. Add RLS policy: admins can update any proposal
 */

const migrationSQL = `
-- 1. Add is_admin to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Drop existing status check constraint and add updated one
-- (constraint name may vary — check your DB if this fails)
ALTER TABLE order_proposal DROP CONSTRAINT IF EXISTS order_proposal_status_check;
ALTER TABLE order_proposal ADD CONSTRAINT order_proposal_status_check
  CHECK (status IN ('open', 'applied', 'rejected', 'withdrawn', 'pending_approval'));

-- 3. RLS policy: admins can update any proposal
CREATE POLICY "Admins can update any proposal"
  ON order_proposal
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- 4. RLS policy: admins can read all proposals (including pending_approval)
CREATE POLICY "Admins can read all proposals"
  ON order_proposal
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );
`;

console.log("Run the following SQL in your Supabase SQL Editor:\n");
console.log(migrationSQL);
