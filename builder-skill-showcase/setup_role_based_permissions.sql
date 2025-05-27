
-- Add policies for sponsors to create challenges
CREATE POLICY "Sponsors can create challenges" ON challenges FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'admin')
  )
);

CREATE POLICY "Sponsors can view their challenges" ON challenges FOR SELECT USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'admin')
  )
);

CREATE POLICY "Sponsors can update their challenges" ON challenges FOR UPDATE USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'admin')
  )
) WITH CHECK (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'admin')
  )
);

CREATE POLICY "Sponsors can delete their challenges" ON challenges FOR DELETE USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'admin')
  )
);

-- Add policies for evaluators to view submissions
CREATE POLICY "Evaluators can view all submissions" ON submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
  )
);

-- Create scores table for evaluator scoring
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sponsor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_score DECIMAL(5,2) DEFAULT 0,
  pre_screening_score INTEGER DEFAULT 0,
  llm_scores JSONB,
  feedback TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on scores
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scores_submission_id ON scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_evaluator_id ON scores(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_scores_company_id ON scores(company_id);
CREATE INDEX IF NOT EXISTS idx_scores_sponsor_id ON scores(sponsor_id);
