-- Grant admin rights to user with ID 3dde62f3-5045-4bc8-90b5-676d7ec368cc
-- This script will assign admin role to the specified user

DO $$
DECLARE
    target_user_id UUID := '3dde62f3-5045-4bc8-90b5-676d7ec368cc';
BEGIN
    -- Check if user exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
        -- Insert admin role (will ignore if already exists)
        INSERT INTO user_roles (user_id, role) 
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        RAISE NOTICE 'Admin role granted to user ID: %', target_user_id;
    ELSE
        RAISE NOTICE 'User with ID % not found in auth.users', target_user_id;
    END IF;
END $$;

-- Fix the infinite recursion issue in policies by recreating the admin policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create a simpler admin policy that doesn't reference itself
-- Use hardcoded admin user ID to prevent infinite recursion
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL USING (
  auth.uid() = '3dde62f3-5045-4bc8-90b5-676d7ec368cc'::uuid
);

-- Verify the admin user was created
SELECT 
  u.email,
  p.username, 
  p.full_name, 
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.id = '3dde62f3-5045-4bc8-90b5-676d7ec368cc';