-- Migration to add archive_json and handle archived status
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS archive_json JSONB;

-- Ensure status check allows 'archived'
-- Note: If status is an ENUM, we need to add the value. 
-- In many supabase setups it's a TEXT column with a check constraint.
-- Let's check if it's a domain or just text. 
-- For now, we'll try to update the constraint if it exists, or just rely on the app logic.
-- A common pattern in this repo seems to be TEXT columns.

-- Update any existing check constraint if it exists (hypothetical name)
-- ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
-- ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check CHECK (status IN ('draft', 'active', 'completed', 'archived'));
