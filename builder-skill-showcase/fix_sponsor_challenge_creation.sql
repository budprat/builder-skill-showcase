
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
-- Check both user_roles table and JWT metadata for role
CREATE POLICY "Sponsors can create challenges" ON challenges 
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Check user_roles table first
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('sponsor', 'company', 'admin')
    ) OR
    -- Fallback: check JWT metadata for role
    (auth.jwt() ->> 'role')::text IN ('sponsor', 'company', 'admin')
  )
);

-- 3. Allow challenge owners and admins to update their challenges
CREATE POLICY "Challenge owners can update" ON challenges 
FOR UPDATE USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) OR
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- 4. Allow challenge owners and admins to delete their challenges
CREATE POLICY "Challenge owners can delete" ON challenges 
FOR DELETE USING (
  company_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ) OR
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'challenges'
ORDER BY policyname;

-- Grant necessary permissions for challenges table
GRANT SELECT, INSERT, UPDATE, DELETE ON challenges TO authenticated;

-- Show current policies to verify they were created correctly
SELECT 
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View'
    WHEN cmd = 'INSERT' THEN 'Create' 
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as action
FROM pg_policies 
WHERE tablename = 'challenges'
ORDER BY policyname;
