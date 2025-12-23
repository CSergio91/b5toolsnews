-- Add state_json column to tournament_sets to store the ScoreCard state
ALTER TABLE public.tournament_sets 
ADD COLUMN IF NOT EXISTS state_json JSONB;

COMMENT ON COLUMN public.tournament_sets.state_json IS 'Stores the full serialized JSON state of the ScoreCard for this set';
