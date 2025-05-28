
-- Final fix for challenge_type constraint

-- Drop all existing constraints that might be causing conflicts
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS valid_challenge_type;
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS valid_change_type;

-- Check current challenge_type values
SELECT DISTINCT challenge_type FROM challenges WHERE challenge_type IS NOT NULL;

-- Update any invalid challenge_type values to 'standard'
UPDATE challenges 
SET challenge_type = 'standard' 
WHERE challenge_type IS NULL 
   OR challenge_type NOT IN ('standard', 'hackathon', 'competition', 'bounty', 'research');

-- Add the constraint with the exact values used in the form
ALTER TABLE challenges 
ADD CONSTRAINT valid_challenge_type 
CHECK (challenge_type IN ('standard', 'hackathon', 'competition', 'bounty', 'research'));

-- Verify the constraint was added
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'valid_challenge_type';

-- Test inserting a valid challenge_type
INSERT INTO challenges (title, description, submission_deadline, challenge_type, difficulty_level, company_id, problem_statement, deliverables, evaluation_rubric) 
VALUES ('Test Challenge', 'Test Description', NOW() + INTERVAL '30 days', 'standard', 'intermediate', 
        (SELECT id FROM auth.users LIMIT 1), 'Test problem statement', '[]'::jsonb, '[]'::jsonb)
ON CONFLICT DO NOTHING;

-- Clean up test record
DELETE FROM challenges WHERE title = 'Test Challenge' AND description = 'Test Description';
