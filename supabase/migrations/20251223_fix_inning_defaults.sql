-- Fix Inning Columns Defaults (Set to 0 instead of NULL)

-- 1. Updates existing NULLs to 0
UPDATE tournament_sets SET vis_inn1 = 0 WHERE vis_inn1 IS NULL;
UPDATE tournament_sets SET vis_inn2 = 0 WHERE vis_inn2 IS NULL;
UPDATE tournament_sets SET vis_inn3 = 0 WHERE vis_inn3 IS NULL;
UPDATE tournament_sets SET vis_inn4 = 0 WHERE vis_inn4 IS NULL;
UPDATE tournament_sets SET vis_inn5 = 0 WHERE vis_inn5 IS NULL;
UPDATE tournament_sets SET vis_ex6 = 0 WHERE vis_ex6 IS NULL;
UPDATE tournament_sets SET vis_ex7 = 0 WHERE vis_ex7 IS NULL;
UPDATE tournament_sets SET vis_ex8 = 0 WHERE vis_ex8 IS NULL;
UPDATE tournament_sets SET vis_ex9 = 0 WHERE vis_ex9 IS NULL;
UPDATE tournament_sets SET vis_ex10 = 0 WHERE vis_ex10 IS NULL;

UPDATE tournament_sets SET loc_inn1 = 0 WHERE loc_inn1 IS NULL;
UPDATE tournament_sets SET loc_inn2 = 0 WHERE loc_inn2 IS NULL;
UPDATE tournament_sets SET loc_inn3 = 0 WHERE loc_inn3 IS NULL;
UPDATE tournament_sets SET loc_inn4 = 0 WHERE loc_inn4 IS NULL;
UPDATE tournament_sets SET loc_inn5 = 0 WHERE loc_inn5 IS NULL;
UPDATE tournament_sets SET loc_ex6 = 0 WHERE loc_ex6 IS NULL;
UPDATE tournament_sets SET loc_ex7 = 0 WHERE loc_ex7 IS NULL;
UPDATE tournament_sets SET loc_ex8 = 0 WHERE loc_ex8 IS NULL;
UPDATE tournament_sets SET loc_ex9 = 0 WHERE loc_ex9 IS NULL;
UPDATE tournament_sets SET loc_ex10 = 0 WHERE loc_ex10 IS NULL;

UPDATE tournament_sets SET home_hits = 0 WHERE home_hits IS NULL;
UPDATE tournament_sets SET away_hits = 0 WHERE away_hits IS NULL;
UPDATE tournament_sets SET home_errors = 0 WHERE home_errors IS NULL;
UPDATE tournament_sets SET away_errors = 0 WHERE away_errors IS NULL;

-- 2. Set Default Value to 0 for future inserts
ALTER TABLE tournament_sets ALTER COLUMN vis_inn1 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_inn2 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_inn3 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_inn4 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_inn5 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_ex6 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_ex7 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_ex8 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_ex9 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN vis_ex10 SET DEFAULT 0;

ALTER TABLE tournament_sets ALTER COLUMN loc_inn1 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_inn2 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_inn3 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_inn4 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_inn5 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_ex6 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_ex7 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_ex8 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_ex9 SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN loc_ex10 SET DEFAULT 0;

ALTER TABLE tournament_sets ALTER COLUMN home_hits SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN away_hits SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN home_errors SET DEFAULT 0;
ALTER TABLE tournament_sets ALTER COLUMN away_errors SET DEFAULT 0;
