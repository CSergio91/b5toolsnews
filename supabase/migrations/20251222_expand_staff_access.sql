-- Allow all staff members (referees and admins) of a tournament to see each other
-- This is necessary so they can see the assigned referee names in the MatchCards

-- Policy for tournament_referees
DROP POLICY IF EXISTS "Enable read access for tournament staff" ON public.tournament_referees;
CREATE POLICY "Enable read access for tournament staff" ON public.tournament_referees
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            -- I am the owner
            EXISTS ( SELECT 1 FROM public.tournaments WHERE id = tournament_referees.tournament_id AND user_id = auth.uid() )
            OR 
            -- I am a referee in this tournament
            EXISTS ( SELECT 1 FROM public.tournament_referees tr WHERE tr.tournament_id = tournament_referees.tournament_id AND tr.email = (auth.jwt() ->> 'email') )
            OR
            -- I am an admin in this tournament
            EXISTS ( SELECT 1 FROM public.tournament_admins ta WHERE ta.tournament_id = tournament_referees.tournament_id AND ta.email = (auth.jwt() ->> 'email') )
        )
    );

-- Policy for tournament_admins
DROP POLICY IF EXISTS "Enable read access for tournament staff" ON public.tournament_admins;
CREATE POLICY "Enable read access for tournament staff" ON public.tournament_admins
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND (
            -- I am the owner
            EXISTS ( SELECT 1 FROM public.tournaments WHERE id = tournament_admins.tournament_id AND user_id = auth.uid() )
            OR 
            -- I am a referee in this tournament
            EXISTS ( SELECT 1 FROM public.tournament_referees tr WHERE tr.tournament_id = tournament_admins.tournament_id AND tr.email = (auth.jwt() ->> 'email') )
            OR
            -- I am an admin in this tournament
            EXISTS ( SELECT 1 FROM public.tournament_admins ta WHERE ta.tournament_id = tournament_admins.tournament_id AND ta.email = (auth.jwt() ->> 'email') )
        )
    );
