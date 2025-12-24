-- Add legacy columns to tournament_sets for compatibility with Dashboard
ALTER TABLE tournament_sets
ADD COLUMN IF NOT EXISTS visitor_runs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS local_runs INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS visitor_hits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS local_hits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS visitor_errors INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS local_errors INT DEFAULT 0;
