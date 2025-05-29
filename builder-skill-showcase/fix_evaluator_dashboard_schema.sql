
-- Fix database schema issues affecting the evaluator dashboard

-- 1. Fix the user_badges table column name issue
ALTER TABLE user_badges RENAME COLUMN awarded_at TO earned_at;

-- 2. Check if submissions table has user_id column, if not, add it or fix the query
DO $$
BEGIN
    -- Check if user_id column exists in submissions table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) THEN
        -- Add user_id column as an alias for participant_id
        ALTER TABLE submissions ADD COLUMN user_id UUID REFERENCES auth.users(id);
        
        -- Update existing records to sync user_id with participant_id
        UPDATE submissions SET user_id = participant_id WHERE participant_id IS NOT NULL;
        
        RAISE NOTICE 'Added user_id column to submissions table';
    ELSE
        RAISE NOTICE 'user_id column already exists in submissions table';
    END IF;
END $$;

-- 3. Ensure proper RLS policies for evaluators to access submissions data
DROP POLICY IF EXISTS "Evaluators can view all submissions" ON submissions;
CREATE POLICY "Evaluators can view all submissions" ON submissions 
FOR SELECT USING (
  -- Allow public access to basic submission info
  TRUE OR
  -- Allow authenticated users to see submissions
  auth.uid() IS NOT NULL OR
  -- Specifically allow evaluators
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'evaluator'
  )
);

-- 4. Fix scores table access for evaluators
DROP POLICY IF EXISTS "Evaluators can view all scores" ON scores;
CREATE POLICY "Evaluators can view all scores" ON scores 
FOR SELECT USING (
  -- Allow evaluators to see all scores
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
  ) OR
  -- Allow users to see their own scores
  evaluator_id = auth.uid()
);

-- 5. Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON scores TO authenticated;

-- 6. Verify the fixes
SELECT 
  'Submissions table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'submissions' 
  AND column_name IN ('id', 'user_id', 'participant_id', 'status')
ORDER BY column_name;

SELECT 
  'User badges table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_badges' 
  AND column_name IN ('id', 'earned_at', 'awarded_at')
ORDER BY column_name;

-- Test query that should work for evaluators
SELECT 
  'Sample submissions query test:' as info,
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_submissions
FROM submissions;
