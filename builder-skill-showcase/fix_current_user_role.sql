
-- Fix the current user's role assignment
-- The user with email 'somanshbudhwar2@gmail.com' should be evaluator, not participant

-- First, let's identify the user
DO $$
DECLARE
    target_user_id UUID;
    current_roles TEXT[];
BEGIN
    -- Find the user by email from auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'somanshbudhwar2@gmail.com';
    
    IF target_user_id IS NULL THEN
        RAISE WARNING 'User with email somanshbudhwar2@gmail.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found user ID: %', target_user_id;
    
    -- Check current roles
    SELECT array_agg(role::text) INTO current_roles
    FROM user_roles 
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'Current roles for user: %', current_roles;
    
    -- Remove participant role if it exists
    DELETE FROM user_roles 
    WHERE user_id = target_user_id AND role = 'participant';
    
    RAISE NOTICE 'Removed participant role for user: %', target_user_id;
    
    -- Add evaluator role
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (target_user_id, 'evaluator', NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Added evaluator role for user: %', target_user_id;
    
    -- Verify the change
    SELECT array_agg(role::text) INTO current_roles
    FROM user_roles 
    WHERE user_id = target_user_id;
    
    RAISE NOTICE 'Updated roles for user: %', current_roles;
END $$;

-- Also update the user metadata to reflect the correct role
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "evaluator"}'::jsonb
WHERE email = 'somanshbudhwar2@gmail.com';

-- Verify the update
SELECT 
    id,
    email,
    raw_user_meta_data->>'role' as metadata_role
FROM auth.users 
WHERE email = 'somanshbudhwar2@gmail.com';

SELECT 
    ur.user_id,
    ur.role,
    au.email
FROM user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'somanshbudhwar2@gmail.com';
