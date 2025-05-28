
-- Ensure scores table has all required columns with proper defaults
ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS technical_implementation DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS innovation DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS presentation DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS practicality DECIMAL(5,2) DEFAULT 0;

-- Update any existing NULL values to 0 (separate UPDATE statements)
UPDATE scores SET technical_implementation = 0 WHERE technical_implementation IS NULL;
UPDATE scores SET innovation = 0 WHERE innovation IS NULL;
UPDATE scores SET presentation = 0 WHERE presentation IS NULL;
UPDATE scores SET practicality = 0 WHERE practicality IS NULL;

-- Set NOT NULL constraints
ALTER TABLE scores ALTER COLUMN technical_implementation SET NOT NULL;
ALTER TABLE scores ALTER COLUMN innovation SET NOT NULL;
ALTER TABLE scores ALTER COLUMN presentation SET NOT NULL;
ALTER TABLE scores ALTER COLUMN practicality SET NOT NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'scores' 
AND column_name IN ('technical_implementation', 'innovation', 'presentation', 'practicality');
