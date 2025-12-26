-- Add tiebreaker_rank to tournament_teams
ALTER TABLE tournament_teams ADD COLUMN IF NOT EXISTS tiebreaker_rank INT DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN tournament_teams.tiebreaker_rank IS 'Manual rank set during tiebreaker resolution to override automatic sorting.';
