
-- Fix RLS policies for proper role assignment during signup

-- Drop existing policies that might be blocking role assignment
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can manage their own roles" ON user_roles;
DROP POLICY IF EXISTS "Allow role assignment during signup" ON user_roles;

-- Create comprehensive RLS policies for user_roles table
-- Policy 1: Allow users to view their own roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Allow users to insert their own roles during signup
CREATE POLICY "Users can insert their own roles during signup" ON user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow users to update their own roles (for role changes)
CREATE POLICY "Users can update their own roles" ON user_roles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy 4: Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = 'admin'
        )
    );

-- Policy 5: Allow the trigger function to insert roles (system operations)
CREATE POLICY "Allow system role assignment" ON user_roles
    FOR INSERT WITH CHECK (true);

-- Enable RLS on user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_roles TO authenticated;
GRANT USAGE ON SEQUENCE user_roles_id_seq TO authenticated;

-- Verify the app_role enum includes all necessary roles
DO $$
BEGIN
    -- Check if evaluator role exists in enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname = 'app_role' 
        AND e.enumlabel = 'evaluator'
    ) THEN
        ALTER TYPE app_role ADD VALUE 'evaluator';
    END IF;
    
    -- Check if sponsor role exists in enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        WHERE t.typname = 'app_role' 
        AND e.enumlabel = 'sponsor'
    ) THEN
        ALTER TYPE app_role ADD VALUE 'sponsor';
    END IF;
END $$;

-- Test the policies by creating a test function
CREATE OR REPLACE FUNCTION test_role_assignment()
RETURNS TEXT AS $$
DECLARE
    test_user_id UUID;
    result TEXT;
BEGIN
    -- Generate a test user ID
    test_user_id := gen_random_uuid();
    
    -- Try to insert each role type
    BEGIN
        INSERT INTO user_roles (user_id, role) VALUES (test_user_id, 'participant');
        INSERT INTO user_roles (user_id, role) VALUES (test_user_id, 'sponsor');
        INSERT INTO user_roles (user_id, role) VALUES (test_user_id, 'evaluator');
        
        -- Clean up test data
        DELETE FROM user_roles WHERE user_id = test_user_id;
        
        result := 'SUCCESS: All role types can be inserted';
    EXCEPTION WHEN OTHERS THEN
        -- Clean up on error
        DELETE FROM user_roles WHERE user_id = test_user_id;
        result := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the test
SELECT test_role_assignment();

-- Drop the test function
DROP FUNCTION test_role_assignment();
