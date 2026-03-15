-- Quest system tables
-- Run this migration in Supabase SQL editor

-- Quest definitions (seeded, not user-created)
CREATE TABLE IF NOT EXISTS quest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('journey', 'weekly', 'seasonal', 'mastery')),
  title text NOT NULL,
  flavour_text text,
  description text NOT NULL,
  aura_type text NOT NULL CHECK (aura_type IN ('pioneer', 'scholar', 'oracle', 'sensei', 'aura', 'archivist')),
  aura_amount integer NOT NULL DEFAULT 0,
  target integer NOT NULL DEFAULT 1,
  condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  era_required text CHECK (era_required IS NULL OR era_required IN ('initiate', 'wanderer', 'adept', 'ascendant')),
  is_hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  season text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-user quest progress
CREATE TABLE IF NOT EXISTS user_quest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_id uuid NOT NULL REFERENCES quest(id) ON DELETE CASCADE,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  aura_awarded integer NOT NULL DEFAULT 0,
  week_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, quest_id, week_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_quest_user_id ON user_quest(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_quest_id ON user_quest(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_week_key ON user_quest(user_id, week_key);
CREATE INDEX IF NOT EXISTS idx_quest_category ON quest(category);

-- RLS
ALTER TABLE quest ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quest ENABLE ROW LEVEL SECURITY;

-- Quest table: readable by everyone (definitions are public)
CREATE POLICY "quest_select_all" ON quest
  FOR SELECT USING (true);

-- User quest: users can read their own rows
CREATE POLICY "user_quest_select_own" ON user_quest
  FOR SELECT USING (auth.uid() = user_id);

-- User quest: users can insert their own rows
CREATE POLICY "user_quest_insert_own" ON user_quest
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User quest: users can update their own rows
CREATE POLICY "user_quest_update_own" ON user_quest
  FOR UPDATE USING (auth.uid() = user_id);
