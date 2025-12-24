-- Add end_time to tournament_matches
ALTER TABLE tournament_matches 
ADD COLUMN IF NOT EXISTS end_time timestamp with time zone;
