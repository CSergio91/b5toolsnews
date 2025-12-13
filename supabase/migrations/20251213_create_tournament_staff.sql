-- Create tournament_referees table
CREATE TABLE IF NOT EXISTS tournament_referees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    rating INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create tournament_admins table
CREATE TABLE IF NOT EXISTS tournament_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    role TEXT DEFAULT 'admin', -- 'admin' or 'moderator'
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE tournament_referees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_admins ENABLE ROW LEVEL SECURITY;

-- Create Policies (Same as other tournament tables)
-- Allow read/write for authenticated users (owner of the tournament logic is handled in app or specific policy)
-- For simplicity in this draft phase, allowing authenticated users to manage their related data.
-- Ideally, we check if auth.uid() == tournament.user_id.

CREATE POLICY "Enable all access for authenticated users based on tournament ownership" ON tournament_referees
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS ( SELECT 1 FROM tournaments WHERE id = tournament_referees.tournament_id AND user_id = auth.uid() )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS ( SELECT 1 FROM tournaments WHERE id = tournament_referees.tournament_id AND user_id = auth.uid() )
    );

CREATE POLICY "Enable all access for authenticated users based on tournament ownership" ON tournament_admins
    FOR ALL
    USING (
        auth.role() = 'authenticated' AND 
        EXISTS ( SELECT 1 FROM tournaments WHERE id = tournament_admins.tournament_id AND user_id = auth.uid() )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS ( SELECT 1 FROM tournaments WHERE id = tournament_admins.tournament_id AND user_id = auth.uid() )
    );

-- Allow Insert if tournament belongs to user (Checking solely on insert might need simpler policy or trigger, but the above covers general usage)
-- Simpler policy for development to avoid recursion blocks if RLS is tricky:
-- CREATE POLICY "Enable all for authenticated users" ON tournament_referees FOR ALL USING (auth.role() = 'authenticated');
-- We'll stick to the safer ownership check above.
