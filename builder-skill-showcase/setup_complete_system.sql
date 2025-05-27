
-- Complete setup script for role-based system
-- Run this script in your Supabase SQL editor

-- Step 1: Update the app_role enum to include new roles
DO $$ 
BEGIN
    -- Check if the enum exists and update it
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        -- Add new enum values if they don't exist
        BEGIN
            ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sponsor';
        EXCEPTION 
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'evaluator';
        EXCEPTION 
            WHEN duplicate_object THEN NULL;
        END;
    ELSE
        -- Create the enum if it doesn't exist
        CREATE TYPE app_role AS ENUM ('admin', 'company', 'participant', 'sponsor', 'evaluator');
    END IF;
END $$;

-- Step 2: Create or update user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'participant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Step 5: Create new policies
CREATE POLICY "Users can read their own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own roles" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Step 7: Update or create has_role function
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Add challenge policies for sponsors
DROP POLICY IF EXISTS "Sponsors can create challenges" ON challenges;
DROP POLICY IF EXISTS "Sponsors can update their challenges" ON challenges;

CREATE POLICY "Sponsors can create challenges" ON challenges FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('sponsor', 'admin')
  )
);

CREATE POLICY "Sponsors can update their challenges" ON challenges FOR UPDATE USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
) WITH CHECK (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Step 9: Add submission policies for evaluators
DROP POLICY IF EXISTS "Evaluators can view all submissions" ON submissions;

CREATE POLICY "Evaluators can view all submissions" ON submissions FOR SELECT USING (
  participant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
  )
);

-- Step 10: Create scores table if it doesn't exist
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

-- Step 11: Enable RLS on scores
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Step 12: Create score policies
DROP POLICY IF EXISTS "Evaluators can manage scores" ON scores;
DROP POLICY IF EXISTS "Sponsors can view scores for their challenges" ON scores;
DROP POLICY IF EXISTS "Companies can view scores for their challenges" ON scores;
DROP POLICY IF EXISTS "Participants can view their scores" ON scores;

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

-- Step 13: Create indexes for scores
CREATE INDEX IF NOT EXISTS idx_scores_submission_id ON scores(submission_id);
CREATE INDEX IF NOT EXISTS idx_scores_evaluator_id ON scores(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_scores_company_id ON scores(company_id);
CREATE INDEX IF NOT EXISTS idx_scores_sponsor_id ON scores(sponsor_id);

-- Step 14: Insert sample admin role (replace with your user ID)
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ('your-admin-user-id-here', 'admin') 
-- ON CONFLICT (user_id) DO NOTHING;

COMMIT;
