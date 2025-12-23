-- Add role and status to tournament_referees if they don't exist
ALTER TABLE public.tournament_referees 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'umpire',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'invited';

-- Allow invited referees to see their own invitations
-- First drop if exists to avoid errors on reapplying
DROP POLICY IF EXISTS "Enable read access for invited referees" ON public.tournament_referees;
CREATE POLICY "Enable read access for invited referees" ON public.tournament_referees
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        email = (auth.jwt() ->> 'email')
    );

-- Allow invited admins to see their own invitations
DROP POLICY IF EXISTS "Enable read access for invited admins" ON public.tournament_admins;
CREATE POLICY "Enable read access for invited admins" ON public.tournament_admins
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND 
        email = (auth.jwt() ->> 'email')
    );
