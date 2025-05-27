
-- Update existing scores table to match the complete system schema
-- Run this script in your Supabase SQL editor

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add evaluator_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'evaluator_id') THEN
        ALTER TABLE scores ADD COLUMN evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add total_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'total_score') THEN
        ALTER TABLE scores ADD COLUMN total_score DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- Add pre_screening_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'pre_screening_score') THEN
        ALTER TABLE scores ADD COLUMN pre_screening_score INTEGER DEFAULT 0;
    END IF;
    
    -- Add llm_scores column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'llm_scores') THEN
        ALTER TABLE scores ADD COLUMN llm_scores JSONB;
    END IF;
    
    -- Add feedback column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'feedback') THEN
        ALTER TABLE scores ADD COLUMN feedback TEXT;
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'status') THEN
        ALTER TABLE scores ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'updated_at') THEN
        ALTER TABLE scores ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add company_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'company_id') THEN
        ALTER TABLE scores ADD COLUMN company_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Add sponsor_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'scores' AND column_name = 'sponsor_id') THEN
        ALTER TABLE scores ADD COLUMN sponsor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Evaluators can manage scores" ON scores;
DROP POLICY IF EXISTS "Sponsors can view scores for their challenges" ON scores;
DROP POLICY IF EXISTS "Companies can view scores for their challenges" ON scores;
DROP POLICY IF EXISTS "Participants can view their scores" ON scores;

-- Create policies for scores
CREATE POLICY "Evaluators can manage scores" ON scores FOR ALL USING (
  evaluator_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
  )
);

CREATE POLICY "Sponsors can view scores for their challenges" ON scores FOR SELECT USING (
  sponsor_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'admin')
  )
);

CREATE POLICY "Companies can view scores for their challenges" ON scores FOR SELECT USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('company', 'admin')
  )
);

CREATE POLICY "Participants can view their scores" ON scores FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM submissions s 
    WHERE s.id = submission_id AND s.participant_id = auth.uid()
  )
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_scores_submission_id ON scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_evaluator_id ON scores(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_scores_company_id ON scores(company_id);
CREATE INDEX IF NOT EXISTS idx_scores_sponsor_id ON scores(sponsor_id);

COMMIT;
