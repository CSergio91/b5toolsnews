-- Add officials_json column to tournament_sets to store specific officials for that set
ALTER TABLE tournaments.tournament_sets 
ADD COLUMN IF NOT EXISTS officials_json JSONB DEFAULT '{}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN tournaments.tournament_sets.officials_json IS 'Stores the names of officials for this specific set: {plate, field1, field2, field3, table}';
