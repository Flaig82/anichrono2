/**
 * Runs the proposal tables migration against Supabase.
 * Uses the database connection string via pg if available,
 * otherwise outputs SQL for manual execution.
 *
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/migrate-proposals.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Split into individual statements so we can run them via PostgREST rpc
// First, we need to create a temporary function that executes SQL
const SETUP_EXEC = `
CREATE OR REPLACE FUNCTION public.exec_migration(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
`;

const STATEMENTS = [
  // Create order_proposal table
  `CREATE TABLE IF NOT EXISTS order_proposal (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    franchise_id uuid NOT NULL REFERENCES franchise(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    proposed_entries jsonb NOT NULL,
    status text NOT NULL DEFAULT 'open'
      CHECK (status IN ('open', 'applied', 'rejected', 'withdrawn')),
    vote_score integer NOT NULL DEFAULT 0,
    applied_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_order_proposal_franchise ON order_proposal(franchise_id)`,

  `CREATE INDEX IF NOT EXISTS idx_order_proposal_status ON order_proposal(status) WHERE status = 'open'`,

  // Create proposal_vote table
  `CREATE TABLE IF NOT EXISTS proposal_vote (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id uuid NOT NULL REFERENCES order_proposal(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value smallint NOT NULL CHECK (value IN (-1, 1)),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(proposal_id, user_id)
  )`,

  // Enable RLS
  `ALTER TABLE order_proposal ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE proposal_vote ENABLE ROW LEVEL SECURITY`,

  // order_proposal policies
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read proposals') THEN
      CREATE POLICY "Anyone can read proposals" ON order_proposal FOR SELECT USING (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can create proposals') THEN
      CREATE POLICY "Auth users can create proposals" ON order_proposal FOR INSERT WITH CHECK (auth.uid() = author_id);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can update own proposals') THEN
      CREATE POLICY "Authors can update own proposals" ON order_proposal FOR UPDATE USING (auth.uid() = author_id);
    END IF;
  END $$`,

  // proposal_vote policies
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read votes') THEN
      CREATE POLICY "Anyone can read votes" ON proposal_vote FOR SELECT USING (true);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth users can vote') THEN
      CREATE POLICY "Auth users can vote" ON proposal_vote FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can change own vote') THEN
      CREATE POLICY "Users can change own vote" ON proposal_vote FOR UPDATE USING (auth.uid() = user_id);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own vote') THEN
      CREATE POLICY "Users can delete own vote" ON proposal_vote FOR DELETE USING (auth.uid() = user_id);
    END IF;
  END $$`,
];

async function runSql(sql: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  Failed: ${text}`);
    return false;
  }
  return true;
}

async function migrate() {
  console.log("Step 1: Creating exec_migration helper function...");

  // Create the helper function via a direct PostgREST call
  // We need to bootstrap — create function via the SQL Editor approach
  const setupRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql: "SELECT 1" }),
  });

  if (!setupRes.ok) {
    console.log("");
    console.log("The exec_migration function doesn't exist yet.");
    console.log("Please run this SQL first in the Supabase SQL Editor (https://supabase.com/dashboard):");
    console.log("");
    console.log(SETUP_EXEC);
    console.log("Then re-run this script.");
    console.log("");
    console.log("Alternatively, run ALL the migration SQL at once:");
    console.log("");
    console.log(STATEMENTS.join(";\n\n") + ";");
    process.exit(1);
  }

  console.log("Step 2: Running migration statements...");

  for (let i = 0; i < STATEMENTS.length; i++) {
    const label = STATEMENTS[i]!.trim().split("\n")[0]!.substring(0, 60);
    process.stdout.write(`  [${i + 1}/${STATEMENTS.length}] ${label}...`);

    const ok = await runSql(STATEMENTS[i]!);
    if (ok) {
      console.log(" OK");
    } else {
      console.log("");
      console.error(`Failed at statement ${i + 1}. Stopping.`);
      process.exit(1);
    }
  }

  console.log("\nMigration complete!");
}

migrate();
