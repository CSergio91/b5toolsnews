-- Add missing runs columns
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS local_runs INTEGER DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS visitor_runs INTEGER DEFAULT 0;

-- Ensure hits/errors are also present (Safety Check)
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS home_hits INTEGER DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS away_hits INTEGER DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS home_errors INTEGER DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS away_errors INTEGER DEFAULT 0;
