
-- Fix challenge constraints to handle existing data

-- First, update any existing challenges that might have invalid values
UPDATE challenges 
SET challenge_type = 'standard' 
WHERE challenge_type IS NULL OR challenge_type NOT IN ('standard', 'hackathon', 'competition', 'bounty', 'research');

UPDATE challenges 
SET difficulty_level = 'intermediate' 
WHERE difficulty_level IS NULL OR difficulty_level NOT IN ('beginner', 'intermediate', 'advanced');

-- Drop existing constraints if they exist (to avoid conflicts)
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS valid_challenge_type;
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS valid_difficulty_level;

-- Add the constraints back
ALTER TABLE challenges 
ADD CONSTRAINT valid_challenge_type 
CHECK (challenge_type IN ('standard', 'hackathon', 'competition', 'bounty', 'research'));

ALTER TABLE challenges 
ADD CONSTRAINT valid_difficulty_level 
CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));

-- Ensure columns exist with proper defaults
ALTER TABLE challenges 
ALTER COLUMN challenge_type SET DEFAULT 'standard';

ALTER TABLE challenges 
ALTER COLUMN difficulty_level SET DEFAULT 'intermediate';

-- Verify the constraints
SELECT 
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'challenges' 
  AND tc.constraint_type = 'CHECK';
