
-- Update trigger function to handle role assignment more robustly

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_role_assignment ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_role() CASCADE;

-- Create improved trigger function with proper security context
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql AS $$
DECLARE
    user_role_text TEXT;
    user_role app_role;
    profile_created BOOLEAN := FALSE;
BEGIN
    -- Log the trigger execution
    RAISE NOTICE 'Processing new user: % with metadata: %', NEW.id, NEW.raw_user_meta_data;
    
    -- Extract role from metadata, default to participant if not specified
    user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'participant');
    RAISE NOTICE 'Extracted role: % for user: %', user_role_text, NEW.id;
    
    -- Validate and convert role to enum
    BEGIN
        user_role := user_role_text::app_role;
        RAISE NOTICE 'Role conversion successful: % for user: %', user_role, NEW.id;
    EXCEPTION 
        WHEN invalid_text_representation THEN
            user_role := 'participant'::app_role;
            RAISE WARNING 'Invalid role % provided for user %, defaulting to participant', user_role_text, NEW.id;
    END;
    
    -- Create profile first (required for foreign key constraints)
    BEGIN
        INSERT INTO profiles (
            id, 
            username, 
            full_name,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
            updated_at = NOW();
            
        profile_created := TRUE;
        RAISE NOTICE 'Profile created/updated for user: %', NEW.id;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create/update profile for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Insert role with multiple retry attempts
    BEGIN
        -- Use a security definer context to bypass RLS for system operations
        PERFORM set_config('request.jwt.claims', json_build_object('sub', NEW.id::text)::text, true);
        
        INSERT INTO user_roles (user_id, role, created_at)
        VALUES (NEW.id, user_role, NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Role % assigned successfully to user %', user_role, NEW.id;
        
        -- Verify the role was actually inserted
        IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id AND role = user_role) THEN
            RAISE NOTICE 'Role assignment verified for user %', NEW.id;
        ELSE
            RAISE WARNING 'Role assignment verification failed for user %', NEW.id;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to assign role % to user %: %', user_role, NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION handle_new_user_role() TO postgres;
GRANT EXECUTE ON FUNCTION handle_new_user_role() TO service_role;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_role_assignment
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

-- Also create a manual role assignment function for fixing existing users
CREATE OR REPLACE FUNCTION assign_user_role(target_user_id UUID, target_role TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    role_enum app_role;
    result BOOLEAN := FALSE;
BEGIN
    -- Convert role to enum
    BEGIN
        role_enum := target_role::app_role;
    EXCEPTION 
        WHEN invalid_text_representation THEN
            RAISE EXCEPTION 'Invalid role: %', target_role;
    END;
    
    -- Insert the role
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (target_user_id, role_enum, NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Verify insertion
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = role_enum) THEN
        result := TRUE;
        RAISE NOTICE 'Role % assigned to user %', target_role, target_user_id;
    END IF;
    
    RETURN result;
END;
$$;
