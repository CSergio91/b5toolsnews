-- Add missing stats columns to tournament_rosters
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS ab INT DEFAULT 0;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS h INT DEFAULT 0;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS r INT DEFAULT 0;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS rbi INT DEFAULT 0;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS avg NUMERIC(5,3) DEFAULT 0.000;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS hr INT DEFAULT 0;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS k INT DEFAULT 0;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS bb INT DEFAULT 0;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS e_def INT DEFAULT 0;
ALTER TABLE tournament_rosters ADD COLUMN IF NOT EXISTS e_of INT DEFAULT 0;

-- Ensure tournament_teams has necessary stats stats columns too if used
ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS stats_ab INT DEFAULT 0;
ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS stats_h INT DEFAULT 0;
ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS stats_r INT DEFAULT 0;
ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS stats_e_def INT DEFAULT 0;
ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS stats_e_of INT DEFAULT 0;

-- Force schema cache reload hint (comment)
-- NOTIFY pgrst, 'reload schema';
