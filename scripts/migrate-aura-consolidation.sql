-- Aura Consolidation Migration: 6 types → 3 types
-- pioneer + sensei → aura
-- oracle → scholar
-- veteran (was "aura" in old schema) stays as "aura"
--
-- Run this against your Supabase database.

BEGIN;

-- 1. Merge pioneer rows into aura (sum values)
UPDATE user_aura AS target
SET value = target.value + source.value
FROM user_aura AS source
WHERE target.user_id = source.user_id
  AND target.aura_type = 'aura'
  AND source.aura_type = 'pioneer';

-- Delete pioneer rows
DELETE FROM user_aura WHERE aura_type = 'pioneer';

-- 2. Merge sensei rows into aura (sum values)
UPDATE user_aura AS target
SET value = target.value + source.value
FROM user_aura AS source
WHERE target.user_id = source.user_id
  AND target.aura_type = 'aura'
  AND source.aura_type = 'sensei';

-- Insert aura rows for users who had sensei but no aura row
INSERT INTO user_aura (user_id, aura_type, value, last_calculated)
SELECT user_id, 'aura', value, last_calculated
FROM user_aura
WHERE aura_type = 'sensei'
  AND user_id NOT IN (SELECT user_id FROM user_aura WHERE aura_type = 'aura');

-- Delete sensei rows
DELETE FROM user_aura WHERE aura_type = 'sensei';

-- 3. Merge oracle rows into scholar (sum values)
UPDATE user_aura AS target
SET value = target.value + source.value
FROM user_aura AS source
WHERE target.user_id = source.user_id
  AND target.aura_type = 'scholar'
  AND source.aura_type = 'oracle';

-- Insert scholar rows for users who had oracle but no scholar row
INSERT INTO user_aura (user_id, aura_type, value, last_calculated)
SELECT user_id, 'scholar', value, last_calculated
FROM user_aura
WHERE aura_type = 'oracle'
  AND user_id NOT IN (SELECT user_id FROM user_aura WHERE aura_type = 'scholar');

-- Delete oracle rows
DELETE FROM user_aura WHERE aura_type = 'oracle';

-- 4. Update quest aura_type references
UPDATE quest SET aura_type = 'aura' WHERE aura_type IN ('pioneer', 'sensei');
UPDATE quest SET aura_type = 'scholar' WHERE aura_type = 'oracle';

-- 5. Update check constraint on user_aura.aura_type
ALTER TABLE user_aura DROP CONSTRAINT IF EXISTS user_aura_aura_type_check;
ALTER TABLE user_aura ADD CONSTRAINT user_aura_aura_type_check
  CHECK (aura_type IN ('aura', 'scholar', 'archivist'));

-- 6. Update check constraint on quest.aura_type
ALTER TABLE quest DROP CONSTRAINT IF EXISTS quest_aura_type_check;
ALTER TABLE quest ADD CONSTRAINT quest_aura_type_check
  CHECK (aura_type IN ('aura', 'scholar', 'archivist'));

-- 7. Update check constraint on users.dominant_aura_type
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_dominant_aura_type_check;
ALTER TABLE users ADD CONSTRAINT users_dominant_aura_type_check
  CHECK (dominant_aura_type IN ('aura', 'scholar', 'archivist'));

COMMIT;
