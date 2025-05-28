
-- Fix evaluator permissions for accessing submissions

-- Enable RLS on submissions if not already enabled
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Evaluators can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Evaluators can view submissions" ON submissions;
DROP POLICY IF EXISTS "Admin and evaluators can view submissions" ON submissions;
DROP POLICY IF EXISTS "Evaluators can view submitted submissions" ON submissions;

-- Create a policy for evaluators to view only REVIEWED submissions
CREATE POLICY "Evaluators can view reviewed submissions" ON submissions FOR SELECT USING (
  status = 'reviewed' AND (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
    )
  )
);

-- Ensure participants can still view their own submissions
CREATE POLICY "Participants can view own submissions" ON submissions FOR SELECT USING (
  participant_id = auth.uid()
);

-- Ensure evaluators can view challenge details
DROP POLICY IF EXISTS "Evaluators can view challenges" ON challenges;
CREATE POLICY "All authenticated can view challenges" ON challenges FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Ensure evaluators can view participant profiles
DROP POLICY IF EXISTS "Evaluators can view profiles" ON profiles;
CREATE POLICY "All authenticated can view profiles" ON profiles FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Fix scores table policies
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Evaluators can manage scores" ON scores;
CREATE POLICY "Evaluators can manage their scores" ON scores FOR ALL USING (
  evaluator_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
  )
);

-- Grant necessary permissions
GRANT SELECT ON submissions TO authenticated;
GRANT SELECT ON challenges TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT ALL ON scores TO authenticated;

-- Verify the setup
SELECT 
  'Current submissions with reviewed status:' as info,
  COUNT(*) as reviewed_count
FROM submissions 
WHERE status = 'reviewed';

SELECT 
  'Current evaluator users:' as info,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'evaluator'
ORDER BY ur.created_at DESC;
