-- Rename location to set_number as requested
ALTER TABLE public.tournament_matches 
RENAME COLUMN location TO set_number;

-- Add description for clarity
COMMENT ON COLUMN public.tournament_matches.set_number IS 'Stores the number of sets (e.g., "1 Set", "3 Sets") for the match configuration';
