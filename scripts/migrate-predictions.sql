-- Predictions system: brackets + seasonal awards
-- Run via Supabase SQL Editor

-- ============================================================
-- 1. bracket — one per season
-- ============================================================
CREATE TABLE IF NOT EXISTS bracket (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  champion_anime_id integer,
  champion_title text,
  champion_cover text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bracket ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view brackets" ON bracket FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. matchup — individual head-to-head within a bracket
-- ============================================================
CREATE TABLE IF NOT EXISTS matchup (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bracket_id uuid NOT NULL REFERENCES bracket(id) ON DELETE CASCADE,
  round text NOT NULL,
  position integer NOT NULL,
  anime_a_id integer,
  anime_a_title text,
  anime_a_cover text,
  anime_a_seed integer,
  anime_b_id integer,
  anime_b_title text,
  anime_b_cover text,
  anime_b_seed integer,
  votes_a integer NOT NULL DEFAULT 0,
  votes_b integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming',
  winner_id integer,
  activated_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bracket_id, round, position)
);

CREATE INDEX IF NOT EXISTS idx_matchup_bracket ON matchup(bracket_id);
CREATE INDEX IF NOT EXISTS idx_matchup_active ON matchup(status) WHERE status = 'active';

ALTER TABLE matchup ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view matchups" ON matchup FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. matchup_vote — one vote per user per matchup
-- ============================================================
CREATE TABLE IF NOT EXISTS matchup_vote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matchup_id uuid NOT NULL REFERENCES matchup(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('a', 'b')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(matchup_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_matchup_vote_matchup ON matchup_vote(matchup_id);
CREATE INDEX IF NOT EXISTS idx_matchup_vote_user ON matchup_vote(user_id);

ALTER TABLE matchup_vote ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view matchup votes" ON matchup_vote FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own matchup votes" ON matchup_vote
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own matchup votes" ON matchup_vote
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own matchup votes" ON matchup_vote
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 4. award — one per category per season
-- ============================================================
CREATE TABLE IF NOT EXISTS award (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season text NOT NULL,
  category text NOT NULL,
  label text NOT NULL,
  emoji text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season, category)
);

ALTER TABLE award ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view awards" ON award FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. award_nominee — shows nominated in each award category
-- ============================================================
CREATE TABLE IF NOT EXISTS award_nominee (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id uuid NOT NULL REFERENCES award(id) ON DELETE CASCADE,
  anime_id integer NOT NULL,
  title text NOT NULL,
  cover_image_url text,
  votes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_award_nominee_award ON award_nominee(award_id);

ALTER TABLE award_nominee ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view award nominees" ON award_nominee FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 6. award_vote — one vote per user per award category
-- ============================================================
CREATE TABLE IF NOT EXISTS award_vote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id uuid NOT NULL REFERENCES award(id) ON DELETE CASCADE,
  nominee_id uuid NOT NULL REFERENCES award_nominee(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(award_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_award_vote_award ON award_vote(award_id);
CREATE INDEX IF NOT EXISTS idx_award_vote_user ON award_vote(user_id);

ALTER TABLE award_vote ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view award votes" ON award_vote FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own award votes" ON award_vote
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own award votes" ON award_vote
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own award votes" ON award_vote
    FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
