
-- Comprehensive diagnostic script to identify signup issues

-- Step 1: Check if the enum has all required values
SELECT 'Enum Values Check' as test_name, 
       array_agg(enumlabel ORDER BY enumsortorder) as available_roles
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role');

-- Step 2: Check if the trigger exists and is enabled
SELECT 'Trigger Check' as test_name,
       tgname as trigger_name,
       tgenabled as is_enabled,
       tgtype as trigger_type
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created_role_assignment';

-- Step 3: Check if the trigger function exists
SELECT 'Function Check' as test_name,
       proname as function_name,
       prosrc as function_body
FROM pg_proc 
WHERE proname = 'handle_new_user_role';

-- Step 4: Check table structure
SELECT 'Table Structure' as test_name,
       column_name, 
       data_type, 
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 5: Check constraints
SELECT 'Constraints Check' as test_name,
       conname as constraint_name, 
       contype as constraint_type,
       confupdtype,
       confdeltype
FROM pg_constraint 
WHERE conrelid = 'user_roles'::regclass;

-- Step 6: Test the trigger function manually with all role types
DO $$
DECLARE
  test_roles TEXT[] := ARRAY['participant', 'sponsor', 'evaluator', 'company', 'admin'];
  test_role TEXT;
  test_user_id UUID;
  test_email TEXT;
  test_metadata JSONB;
  error_occurred BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE 'Starting manual trigger function tests...';
  
  FOREACH test_role IN ARRAY test_roles LOOP
    BEGIN
      test_user_id := gen_random_uuid();
      test_email := test_role || '_test@example.com';
      test_metadata := json_build_object('role', test_role, 'full_name', 'Test ' || test_role)::jsonb;
      
      RAISE NOTICE 'Testing role: %', test_role;
      
      -- Create a temporary test user record structure
      INSERT INTO profiles (id, username, full_name, created_at, updated_at)
      VALUES (test_user_id, test_role || '_test', 'Test ' || test_role, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
      
      -- Test the role assignment
      INSERT INTO user_roles (user_id, role, created_at)
      VALUES (test_user_id, test_role::app_role, NOW())
      ON CONFLICT (user_id, role) DO NOTHING;
      
      -- Clean up test data
      DELETE FROM user_roles WHERE user_id = test_user_id;
      DELETE FROM profiles WHERE id = test_user_id;
      
      RAISE NOTICE 'Role % test passed', test_role;
      
    EXCEPTION 
      WHEN others THEN
        error_occurred := TRUE;
        RAISE WARNING 'Role % test failed: %', test_role, SQLERRM;
        
        -- Clean up on error
        BEGIN
          DELETE FROM user_roles WHERE user_id = test_user_id;
          DELETE FROM profiles WHERE id = test_user_id;
        EXCEPTION 
          WHEN others THEN NULL;
        END;
    END;
  END LOOP;
  
  IF NOT error_occurred THEN
    RAISE NOTICE 'All role tests passed successfully!';
  ELSE
    RAISE NOTICE 'Some role tests failed - check warnings above';
  END IF;
END $$;

-- Step 7: Check for orphaned or invalid data
SELECT 'Data Integrity Check' as test_name,
       'Users without profiles' as check_type,
       COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

SELECT 'Data Integrity Check' as test_name,
       'Invalid role values' as check_type,
       COUNT(*) as count
FROM user_roles ur
WHERE ur.role NOT IN ('admin', 'company', 'participant', 'sponsor', 'evaluator');

-- Step 8: Check auth.users table access
SELECT 'Auth Table Access' as test_name,
       COUNT(*) as user_count
FROM auth.users;

-- Step 9: Test enum casting for all values
DO $$
DECLARE
  test_roles TEXT[] := ARRAY['participant', 'sponsor', 'evaluator', 'company', 'admin'];
  test_role TEXT;
BEGIN
  RAISE NOTICE 'Testing enum casting...';
  
  FOREACH test_role IN ARRAY test_roles LOOP
    BEGIN
      PERFORM test_role::app_role;
      RAISE NOTICE 'Enum cast test for % passed', test_role;
    EXCEPTION 
      WHEN others THEN
        RAISE WARNING 'Enum cast test for % failed: %', test_role, SQLERRM;
    END;
  END LOOP;
END $$;

RAISE NOTICE 'Diagnostic script completed. Check the results above to identify the issue.';
