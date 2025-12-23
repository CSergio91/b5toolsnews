-- Migration: Phase 3 Cleanup & RLS Fix

-- 1. FIX RLS RECURSION using a Security Definer function
-- This allows us to check membership without triggering the policy recursively
CREATE OR REPLACE FUNCTION public.check_is_tournament_staff(_tournament_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tournaments WHERE id = _tournament_id AND user_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM tournament_referees WHERE tournament_id = _tournament_id AND email = (auth.jwt() ->> 'email')
    ) OR EXISTS (
        SELECT 1 FROM tournament_admins WHERE tournament_id = _tournament_id AND email = (auth.jwt() ->> 'email')
    );
END;
$$;

-- Apply fixed policies
DROP POLICY IF EXISTS "Enable read access for tournament staff" ON public.tournament_referees;
CREATE POLICY "Enable read access for tournament staff" ON public.tournament_referees
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND check_is_tournament_staff(tournament_id)
    );

DROP POLICY IF EXISTS "Enable read access for tournament staff" ON public.tournament_admins;
CREATE POLICY "Enable read access for tournament staff" ON public.tournament_admins
    FOR SELECT
    USING (
        auth.role() = 'authenticated' AND check_is_tournament_staff(tournament_id)
    );


-- 2. SCHEMA CLEANUP
-- Add boolean flag for single set matches
ALTER TABLE public.tournament_matches ADD COLUMN IF NOT EXISTS is_single_set BOOLEAN DEFAULT FALSE;

-- Migrate logic from location to boolean
UPDATE public.tournament_matches 
SET is_single_set = TRUE 
WHERE location = '1 Set';

-- Restore location from field
UPDATE public.tournament_matches 
SET location = field 
WHERE location = '1 Set' AND field IS NOT NULL;

-- Fallback for empty location
UPDATE public.tournament_matches 
SET location = 'Cancha Default' 
WHERE (location = '1 Set' OR location IS NULL OR location = '') AND (field IS NULL OR field = '');

-- Final sync location from field
UPDATE public.tournament_matches
SET location = field
WHERE (location IS NULL OR location = '' OR location = '1 Set') AND field IS NOT NULL;
