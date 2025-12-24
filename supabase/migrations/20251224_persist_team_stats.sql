-- 1. Add Summary Columns to tournament_sets
ALTER TABLE tournament_sets
ADD COLUMN IF NOT EXISTS home_hits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS away_hits INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS home_errors INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS away_errors INT DEFAULT 0;

-- 2. Function to Recalculate Stats due to complexity of updates
CREATE OR REPLACE FUNCTION recalculate_team_stats(t_id UUID)
RETURNS VOID AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Reset Stats for all teams in tournament
    UPDATE tournament_teams
    SET 
        wins = 0,
        losses = 0,
        gp = 0,
        pts = 0,
        runs_scored = 0,
        runs_allowed = 0,
        stats_h = 0,
        stats_r = 0,
        stats_e_def = 0
    WHERE tournament_id = t_id;

    -- Aggregate Match Results (W/L/PTS/GP)
    -- Wins/Losses/Points come from 'finished' matches
    FOR rec IN 
        SELECT 
            m.winner_team_id,
            m.visitor_team_id,
            m.local_team_id
        FROM tournament_matches m
        WHERE m.tournament_id = t_id AND m.status = 'finished'
    LOOP
        -- If Winner is Visitor
        IF rec.winner_team_id = rec.visitor_team_id THEN
            UPDATE tournament_teams SET wins = wins + 1, pts = pts + 1, gp = gp + 1 WHERE id = rec.visitor_team_id;
            UPDATE tournament_teams SET losses = losses + 1, gp = gp + 1 WHERE id = rec.local_team_id;
        -- If Winner is Local
        ELSIF rec.winner_team_id = rec.local_team_id THEN
            UPDATE tournament_teams SET wins = wins + 1, pts = pts + 1, gp = gp + 1 WHERE id = rec.local_team_id;
            UPDATE tournament_teams SET losses = losses + 1, gp = gp + 1 WHERE id = rec.visitor_team_id;
        END IF;
    END LOOP;

    -- Aggregate Set Stats (Runs/Hits/Errors)
    -- We join sets to matches to teams
    FOR rec IN
        SELECT 
            m.visitor_team_id,
            m.local_team_id,
            COALESCE(s.away_score, 0) as v_runs,
            COALESCE(s.home_score, 0) as l_runs,
            COALESCE(s.away_hits, 0) as v_hits,
            COALESCE(s.home_hits, 0) as l_hits,
            COALESCE(s.away_errors, 0) as v_errors,
            COALESCE(s.home_errors, 0) as l_errors
        FROM tournament_sets s
        JOIN tournament_matches m ON s.match_id = m.id
        WHERE m.tournament_id = t_id AND m.status = 'finished' -- Only finished matches count for stats? Or all? User likely wants verified stats. Stick to finished or live? Let's use Finished for consistency with W/L.
    LOOP
        -- Visitor Update
        UPDATE tournament_teams SET 
            runs_scored = runs_scored + rec.v_runs,
            runs_allowed = runs_allowed + rec.l_runs,
            stats_r = stats_r + rec.v_runs,
            stats_h = stats_h + rec.v_hits,
            stats_e_def = stats_e_def + rec.v_errors
        WHERE id = rec.visitor_team_id;

        -- Local Update
        UPDATE tournament_teams SET 
            runs_scored = runs_scored + rec.l_runs,
            runs_allowed = runs_allowed + rec.v_runs,
            stats_r = stats_r + rec.l_runs,
            stats_h = stats_h + rec.l_hits,
            stats_e_def = stats_e_def + rec.l_errors
        WHERE id = rec.local_team_id;
    END LOOP;

END;
$$ LANGUAGE plpgsql;

-- 3. Triggers
-- Trigger on Match Update (Status change)
CREATE OR REPLACE FUNCTION trigger_recalc_stats_match()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status <> NEW.status) OR (TG_OP = 'INSERT') THEN
         PERFORM recalculate_team_stats(NEW.tournament_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_match_stats_update ON tournament_matches;
CREATE TRIGGER on_match_stats_update
AFTER UPDATE OR INSERT ON tournament_matches
FOR EACH ROW
EXECUTE FUNCTION trigger_recalc_stats_match();

-- Trigger on Set Update (Score/Hits change)
CREATE OR REPLACE FUNCTION trigger_recalc_stats_set()
RETURNS TRIGGER AS $$
DECLARE
    t_id UUID;
BEGIN
    SELECT tournament_id INTO t_id FROM tournament_matches WHERE id = NEW.match_id;
    IF t_id IS NOT NULL THEN
        PERFORM recalculate_team_stats(t_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_set_stats_update ON tournament_sets;
CREATE TRIGGER on_set_stats_update
AFTER UPDATE OR INSERT ON tournament_sets
FOR EACH ROW
EXECUTE FUNCTION trigger_recalc_stats_set();
