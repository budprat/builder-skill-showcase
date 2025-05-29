
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
    (auth.jwt() ->> 'role')::text IN ('sponsor', 'company', 'admin') OR
    -- Additional fallback: check user_metadata in auth.users
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data ->> 'role')::text IN ('sponsor', 'company', 'admin')
    )
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

-- Also ensure the user has a role in user_roles table for consistency
-- This will help with future queries that depend on the user_roles table
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
  u.id,
  (u.raw_user_meta_data ->> 'role')::app_role,
  NOW()
FROM auth.users u
WHERE u.raw_user_meta_data ->> 'role' IS NOT NULL
  AND (u.raw_user_meta_data ->> 'role')::text IN ('sponsor', 'company', 'admin', 'evaluator', 'participant')
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = u.id 
    AND ur.role = (u.raw_user_meta_data ->> 'role')::app_role
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify user roles were assigned
SELECT 
  u.email,
  u.raw_user_meta_data ->> 'role' as metadata_role,
  ur.role as assigned_role
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.raw_user_meta_data ->> 'role' IS NOT NULL;
