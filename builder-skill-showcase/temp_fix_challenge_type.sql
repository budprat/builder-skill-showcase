
-- Temporary fix to accept both challenge type value sets

-- Drop existing constraint
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS valid_challenge_type;

-- Add more permissive constraint that accepts both value sets
ALTER TABLE challenges 
ADD CONSTRAINT valid_challenge_type 
CHECK (challenge_type IN (
  'standard', 'hackathon', 'competition', 'bounty', 'research',
  'web_development', 'mobile_development', 'data_science', 
  'machine_learning', 'algorithms', 'system_design', 'other'
));

-- Verify the constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'valid_challenge_type';
