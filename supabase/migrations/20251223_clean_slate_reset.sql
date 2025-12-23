-- CLEAN SLATE RESET
-- Run this if you get 400 Bad Request (Column mismatch)

-- 1. Drop Columns (To clear any stuck schema or wrong types)
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_inn1;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_inn2;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_inn3;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_inn4;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_inn5;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_ex6;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_ex7;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_ex8;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_ex9;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS vis_ex10;

ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_inn1;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_inn2;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_inn3;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_inn4;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_inn5;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_ex6;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_ex7;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_ex8;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_ex9;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS loc_ex10;

ALTER TABLE tournament_sets DROP COLUMN IF EXISTS home_hits;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS away_hits;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS home_errors;
ALTER TABLE tournament_sets DROP COLUMN IF EXISTS away_errors;

-- 2. Re-Create Clean Columns
ALTER TABLE tournament_sets ADD COLUMN vis_inn1 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_inn2 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_inn3 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_inn4 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_inn5 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_ex6 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_ex7 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_ex8 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_ex9 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN vis_ex10 INT DEFAULT 0;

ALTER TABLE tournament_sets ADD COLUMN loc_inn1 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_inn2 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_inn3 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_inn4 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_inn5 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_ex6 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_ex7 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_ex8 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_ex9 INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN loc_ex10 INT DEFAULT 0;

ALTER TABLE tournament_sets ADD COLUMN home_hits INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN away_hits INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN home_errors INT DEFAULT 0;
ALTER TABLE tournament_sets ADD COLUMN away_errors INT DEFAULT 0;
