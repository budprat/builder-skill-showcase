
-- Add difficulty_level column to challenges table
ALTER TABLE challenges 
ADD COLUMN difficulty_level VARCHAR(50) DEFAULT 'intermediate';

-- Add constraint to ensure valid difficulty levels
ALTER TABLE challenges 
ADD CONSTRAINT valid_difficulty_level 
CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));

-- Create index for better performance
CREATE INDEX idx_challenges_difficulty_level ON challenges(difficulty_level);

-- Update existing challenges to have default difficulty level
UPDATE challenges 
SET difficulty_level = 'intermediate' 
WHERE difficulty_level IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN challenges.difficulty_level IS 'Difficulty level of the challenge: beginner, intermediate, advanced';
