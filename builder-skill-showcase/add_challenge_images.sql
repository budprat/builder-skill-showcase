
-- Add image_url column to challenges table
ALTER TABLE challenges 
ADD COLUMN image_url TEXT;

-- Add image_urls column for multiple images (JSON array)
ALTER TABLE challenges 
ADD COLUMN image_urls JSONB DEFAULT '[]'::jsonb;

-- Create index for better performance on image queries
CREATE INDEX idx_challenges_image_url ON challenges(image_url) WHERE image_url IS NOT NULL;

-- Update existing challenges to have empty image arrays
UPDATE challenges 
SET image_urls = '[]'::jsonb 
WHERE image_urls IS NULL;

-- Add constraint to ensure valid JSON format for image_urls
ALTER TABLE challenges 
ADD CONSTRAINT valid_image_urls 
CHECK (jsonb_typeof(image_urls) = 'array');

COMMENT ON COLUMN challenges.image_url IS 'Primary image URL for the challenge';
COMMENT ON COLUMN challenges.image_urls IS 'JSON array of additional image URLs for the challenge';
