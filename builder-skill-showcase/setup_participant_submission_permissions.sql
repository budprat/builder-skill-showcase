
-- Allow participants to edit and delete their own submissions
-- But prevent editing if submission is already being evaluated or completed

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Participants can insert submissions" ON submissions;
DROP POLICY IF EXISTS "Participants can update own submissions" ON submissions;
DROP POLICY IF EXISTS "Participants can delete own submissions" ON submissions;

-- Allow participants to insert their submissions
CREATE POLICY "Participants can insert submissions" ON submissions 
FOR INSERT 
WITH CHECK (
  participant_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'participant'
  )
);

-- Allow participants to update their own submissions
-- But only if status is 'submitted' (not under review or completed)
CREATE POLICY "Participants can update own submissions" ON submissions 
FOR UPDATE 
USING (
  participant_id = auth.uid() AND
  status IN ('submitted', 'draft') AND
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'participant'
  )
)
WITH CHECK (
  participant_id = auth.uid() AND
  status IN ('submitted', 'draft') AND
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'participant'
  )
);

-- Allow participants to delete their own submissions
-- But only if status is 'submitted' or 'draft' (not under review or completed)
CREATE POLICY "Participants can delete own submissions" ON submissions 
FOR DELETE 
USING (
  participant_id = auth.uid() AND
  status IN ('submitted', 'draft') AND
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'participant'
  )
);

-- Grant necessary permissions
GRANT INSERT, UPDATE, DELETE ON submissions TO authenticated;

-- Verify policies are working
SELECT 
  'Submission policies created successfully' as message,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'submissions' 
  AND policyname LIKE '%Participants can%';
