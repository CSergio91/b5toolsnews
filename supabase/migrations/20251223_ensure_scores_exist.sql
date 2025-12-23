-- Ensure home_score and away_score exist (User requested these names)
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS home_score INTEGER DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS away_score INTEGER DEFAULT 0;

-- Ensure hits/errors exist (Just in case)
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS home_hits INTEGER DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS away_hits INTEGER DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS home_errors INTEGER DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS away_errors INTEGER DEFAULT 0;

-- Sync the old columns to new ones if needed (Optional, but good for consistency)
-- UPDATE tournament_sets SET home_score = local_runs WHERE home_score = 0 AND local_runs > 0;
-- UPDATE tournament_sets SET away_score = visitor_runs WHERE away_score = 0 AND visitor_runs > 0;
