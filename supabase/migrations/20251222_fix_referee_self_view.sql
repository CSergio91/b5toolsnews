-- Migration: Explicit Self-View for Staff
-- Description: Allow users to see their own records in tournament_referees and tournament_admins
-- purely based on email match, avoiding any recursive function overhead for the initial check.

-- 1. Tournament Referees: Self View
DROP POLICY IF EXISTS "Enable read access for tournament staff" ON public.tournament_referees;
CREATE POLICY "Enable read access for tournament staff" ON public.tournament_referees
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            -- Direct email match (See yourself)
            email = (auth.jwt() ->> 'email')
            OR
            -- Or see others if you are staff (Owner, Admin, or Referee)
            check_is_tournament_staff(tournament_id)
        )
    );

-- 2. Tournament Admins: Self View
DROP POLICY IF EXISTS "Enable read access for tournament staff" ON public.tournament_admins;
CREATE POLICY "Enable read access for tournament staff" ON public.tournament_admins
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            email = (auth.jwt() ->> 'email')
            OR
            check_is_tournament_staff(tournament_id)
        )
    );
