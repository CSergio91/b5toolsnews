-- Migration: Fix Tournaments RLS for Staff
-- Description: Allow invited staff (admins/referees) to view the tournament details.
-- Also allows them to score matches (Update matches/sets).

-- 1. Enable Read Access on 'tournaments' for Staff
-- CRITICAL: Without this, staff cannot join the tournament because querying 'tournaments' returns empty.
DROP POLICY IF EXISTS "Enable read access for tournament staff" ON public.tournaments;
CREATE POLICY "Enable read access for tournament staff" ON public.tournaments
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND check_is_tournament_staff(id)
    );

-- 2. Allow Staff to READ matches
DROP POLICY IF EXISTS "Enable read access for tournament staff" ON public.tournament_matches;
CREATE POLICY "Enable read access for tournament staff" ON public.tournament_matches
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND check_is_tournament_staff(tournament_id)
    );

-- 3. Allow Staff to UPDATE matches (e.g. status, score_text)
DROP POLICY IF EXISTS "Enable update access for tournament staff" ON public.tournament_matches;
CREATE POLICY "Enable update access for tournament staff" ON public.tournament_matches
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND check_is_tournament_staff(tournament_id)
    );

-- 4. Allow Staff to CRUD sets (Scoring)
-- Note: Subquery gets tournament_id from parent match
DROP POLICY IF EXISTS "Enable all access for tournament staff" ON public.tournament_sets;
CREATE POLICY "Enable all access for tournament staff" ON public.tournament_sets
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND check_is_tournament_staff(
            (SELECT tournament_id FROM public.tournament_matches WHERE id = match_id)
        )
    );
