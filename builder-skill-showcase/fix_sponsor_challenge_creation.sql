
-- Fix RLS policies to allow sponsors to create challenges

-- First, check current policies on challenges table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'challenges';

-- Drop all existing policies that might be conflicting
DROP POLICY IF EXISTS "Public can view challenges" ON challenges;
DROP POLICY IF EXISTS "Sponsors can create challenges" ON challenges;
DROP POLICY IF EXISTS "Authorized users can create challenges" ON challenges;
DROP POLICY IF EXISTS "Challenge owners can update" ON challenges;
DROP POLICY IF EXISTS "Sponsors can update their challenges" ON challenges;
DROP POLICY IF EXISTS "Sponsors can delete their challenges" ON challenges;

-- Create comprehensive policies for challenges table

-- 1. Everyone can view active challenges (public visibility)
CREATE POLICY "Public can view challenges" ON challenges 
FOR SELECT USING (status = 'active' OR auth.uid() IS NOT NULL);

-- 2. Allow sponsors, companies, and admins to create challenges
CREATE POLICY "Sponsors can create challenges" ON challenges 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('sponsor', 'company', 'admin')
    ) OR
    -- Fallback: allow if user metadata contains sponsor role
    (auth.jwt() ->> 'role')::text IN ('sponsor', 'company', 'admin')
  )
);

-- 3. Allow challenge owners and admins to update challenges
CREATE POLICY "Challenge owners can update" ON challenges 
FOR UPDATE USING (
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

-- 4. Allow challenge owners and admins to delete challenges
CREATE POLICY "Challenge owners can delete" ON challenges 
FOR DELETE USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON challenges TO authenticated;
GRANT USAGE ON SEQUENCE challenges_id_seq TO authenticated;

-- Verify the policies were created
SELECT 
  policyname, 
  cmd, 
  permissive,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View'
    WHEN cmd = 'INSERT' THEN 'Create' 
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as action,
  qual as condition
FROM pg_policies 
WHERE tablename = 'challenges'
ORDER BY cmd, policyname;

-- Test the policy by checking what the current user can do
SELECT 
  'Current user ID: ' || COALESCE(auth.uid()::text, 'NULL') as user_info,
  'User role: ' || COALESCE(
    (SELECT role::text FROM user_roles WHERE user_id = auth.uid() LIMIT 1), 
    'No role found'
  ) as role_info;
