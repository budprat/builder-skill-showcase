
-- Complete fix for signup issues with sponsor and evaluator roles

-- Step 1: Drop and recreate the trigger function with better error handling
DROP FUNCTION IF EXISTS handle_new_user_role() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role_text TEXT;
  user_role app_role;
  profile_exists BOOLEAN;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired for user: % with metadata: %', NEW.id, NEW.raw_user_meta_data;
  
  -- Extract role from metadata
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'participant');
  RAISE NOTICE 'Extracted role: %', user_role_text;
  
  -- Validate and convert role to enum
  BEGIN
    user_role := user_role_text::app_role;
    RAISE NOTICE 'Role conversion successful: %', user_role;
  EXCEPTION 
    WHEN invalid_text_representation THEN
      user_role := 'participant'::app_role;
      RAISE WARNING 'Invalid role % provided for user %, defaulting to participant', user_role_text, NEW.id;
  END;
  
  -- Check if profile exists (this might be needed for foreign key constraints)
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
  RAISE NOTICE 'Profile exists for user %: %', NEW.id, profile_exists;
  
  -- Create profile if it doesn't exist
  IF NOT profile_exists THEN
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
      ) ON CONFLICT (id) DO NOTHING;
      RAISE NOTICE 'Profile created for user: %', NEW.id;
    EXCEPTION 
      WHEN others THEN
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  -- Insert the role with detailed error handling
  BEGIN
    INSERT INTO user_roles (user_id, role, created_at)
    VALUES (NEW.id, user_role, NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role % assigned successfully to user %', user_role, NEW.id;
  EXCEPTION 
    WHEN foreign_key_violation THEN
      RAISE WARNING 'Foreign key violation when assigning role % to user %: %', user_role, NEW.id, SQLERRM;
    WHEN unique_violation THEN
      RAISE NOTICE 'Role % already exists for user % (this is normal)', user_role, NEW.id;
    WHEN others THEN
      RAISE WARNING 'Unexpected error assigning role % to user %: %', user_role, NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role_assignment ON auth.users;
CREATE TRIGGER on_auth_user_created_role_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

-- Step 3: Ensure the unique constraint allows multiple roles per user but prevents duplicates
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Step 4: Test the function manually to see if it works
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
  test_metadata JSONB := '{"role": "evaluator", "full_name": "Test User"}';
BEGIN
  RAISE NOTICE 'Testing trigger function with synthetic data...';
  
  -- Simulate the trigger call
  PERFORM handle_new_user_role() FROM (
    SELECT 
      test_user_id as id,
      test_email as email,
      test_metadata as raw_user_meta_data
  ) as NEW;
  
  RAISE NOTICE 'Test completed successfully';
EXCEPTION 
  WHEN others THEN
    RAISE WARNING 'Test failed: %', SQLERRM;
END $$;

-- Step 5: Check for any orphaned data that might cause issues
SELECT 
  'Checking for users without profiles...' as check_type,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

SELECT 
  'Checking for invalid enum values...' as check_type,
  COUNT(*) as count
FROM user_roles ur
WHERE ur.role NOT IN ('admin', 'company', 'participant', 'sponsor', 'evaluator');

-- Step 6: Show current enum values to confirm they're all there
SELECT 
  'Available roles:' as info,
  array_agg(enumlabel ORDER BY enumsortorder) as roles
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role');
