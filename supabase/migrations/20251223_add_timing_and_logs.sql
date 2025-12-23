-- Add activity_log JSONB column to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS activity_log jsonb DEFAULT '[]'::jsonb;

-- Add start_time and end_time to tournament_sets
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS start_time timestamp with time zone;
ALTER TABLE tournament_sets ADD COLUMN IF NOT EXISTS end_time timestamp with time zone;

-- Ensure tournament_matches has start_time (it likely exists but good to ensure type match if needed, though usually text or timestamp)
-- We assume matches.start_time exists.
