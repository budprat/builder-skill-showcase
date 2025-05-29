
-- Restore admin role that was lost when table was recreated

-- First, ensure admin role exists in the enum
DO $$
BEGIN
    -- Check if admin role exists in enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname = 'app_role' 
        AND e.enumlabel = 'admin'
    ) THEN
        ALTER TYPE app_role ADD VALUE 'admin';
        RAISE NOTICE 'Added admin role to enum';
    ELSE
        RAISE NOTICE 'Admin role already exists in enum';
    END IF;
END $$;

-- Restore admin role to the user (from the logs, user ID: 3dde62f3-5045-4bc8-90b5-676d7ec368cc)
INSERT INTO user_roles (user_id, role, created_at)
VALUES ('3dde62f3-5045-4bc8-90b5-676d7ec368cc'::uuid, 'admin', NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- Also remove the participant role from this admin user
DELETE FROM user_roles 
WHERE user_id = '3dde62f3-5045-4bc8-90b5-676d7ec368cc'::uuid 
AND role = 'participant';

-- Fix the infinite recursion in admin policy by using a direct user ID check
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

CREATE POLICY "Admins can manage all roles" ON user_roles 
FOR ALL USING (
  auth.uid() = '3dde62f3-5045-4bc8-90b5-676d7ec368cc'::uuid
);

-- Verify the admin role was restored
SELECT 
    ur.user_id,
    ur.role,
    au.email,
    ur.created_at
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.user_id = '3dde62f3-5045-4bc8-90b5-676d7ec368cc'::uuid;

RAISE NOTICE 'Admin role restored successfully';
