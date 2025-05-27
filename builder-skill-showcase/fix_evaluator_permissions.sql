
-- Fix evaluator permissions for accessing submissions

-- Enable RLS on submissions if not already enabled
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Evaluators can view all submissions" ON submissions;
DROP POLICY IF EXISTS "Evaluators can view submissions" ON submissions;
DROP POLICY IF EXISTS "Admin and evaluators can view submissions" ON submissions;

-- Create a comprehensive policy for evaluators to view submissions
CREATE POLICY "Evaluators can view submitted submissions" ON submissions FOR SELECT USING (
  status = 'submitted' AND (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
    )
  )
);

-- Ensure evaluators can view challenge details
DROP POLICY IF EXISTS "Evaluators can view challenges" ON challenges;
CREATE POLICY "Evaluators can view challenges" ON challenges FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin', 'participant')
  )
);

-- Ensure evaluators can view participant profiles
DROP POLICY IF EXISTS "Evaluators can view profiles" ON profiles;
CREATE POLICY "Evaluators can view profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
  )
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
  'Current evaluator users:' as info,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'evaluator'
ORDER BY ur.created_at DESC;
