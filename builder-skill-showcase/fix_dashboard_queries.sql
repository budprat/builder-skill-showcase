
-- Fix database schema issues for dashboard queries

-- 1. Ensure submissions table has the correct structure
SELECT 
  'Submissions table columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'submissions' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'participant_id', 'user_id', 'status', 'created_at', 'submitted_at')
ORDER BY column_name;

-- 2. Ensure user_badges table has the correct structure  
SELECT 
  'User badges table columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_badges' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'earned_at', 'awarded_at', 'user_id', 'badge_id')
ORDER BY column_name;

-- 3. Check scores table structure
SELECT 
  'Scores table columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'scores' 
  AND table_schema = 'public'
ORDER BY column_name;

-- 4. Verify foreign key relationships
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('submissions', 'scores', 'user_badges');

-- 5. Test query that should work for evaluators
SELECT 
  'Test submissions query:' as info,
  s.id,
  s.status,
  s.participant_id,
  c.title as challenge_title,
  p.full_name as participant_name,
  COUNT(sc.id) as score_count
FROM submissions s
LEFT JOIN challenges c ON s.challenge_id = c.id
LEFT JOIN profiles p ON s.participant_id = p.id
LEFT JOIN scores sc ON s.id = sc.submission_id
WHERE s.status = 'reviewed'
GROUP BY s.id, s.status, s.participant_id, c.title, p.full_name
ORDER BY s.created_at DESC;

-- 6. Grant necessary permissions for evaluators
GRANT SELECT ON submissions TO authenticated;
GRANT SELECT ON challenges TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON scores TO authenticated;
GRANT SELECT ON user_badges TO authenticated;

-- 7. Update RLS policies to ensure evaluators can access submission data
DROP POLICY IF EXISTS "Evaluators can view reviewed submissions" ON submissions;
CREATE POLICY "Evaluators can view reviewed submissions" ON submissions 
FOR SELECT USING (
  status = 'reviewed' OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
  )
);
