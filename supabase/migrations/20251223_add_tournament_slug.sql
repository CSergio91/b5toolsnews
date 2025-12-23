-- Add slug column to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS slug text;

-- Optional: Create a value for existing rows based on name (simple sanitize)
-- We can do a simple update, though perfect slugification in SQL is hard. 
-- Let's just create the column for now.
-- COMMENTED OUT AUTO-UPDATE TO AVOID COMPLEXITY, APP WILL HANDLE OR ADMIN WILL UPDATE
-- UPDATE tournaments SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL;
