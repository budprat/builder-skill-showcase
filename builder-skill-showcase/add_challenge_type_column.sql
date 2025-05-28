
-- Add challenge_type column to challenges table
ALTER TABLE challenges 
ADD COLUMN challenge_type VARCHAR(50) DEFAULT 'standard';

-- Add constraint to ensure valid challenge types
ALTER TABLE challenges 
ADD CONSTRAINT valid_challenge_type 
CHECK (challenge_type IN ('standard', 'hackathon', 'competition', 'bounty', 'research'));

-- Create index for better performance
CREATE INDEX idx_challenges_challenge_type ON challenges(challenge_type);

-- Update existing challenges to have default type
UPDATE challenges 
SET challenge_type = 'standard' 
WHERE challenge_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN challenges.challenge_type IS 'Type of challenge: standard, hackathon, competition, bounty, research';
