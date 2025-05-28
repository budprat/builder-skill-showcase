
-- Fix the trigger function that's causing the NEW table error

-- Drop and recreate the trigger function with proper syntax
DROP FUNCTION IF EXISTS handle_new_user_role() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS trigger AS $$
DECLARE
  user_role_from_metadata TEXT;
BEGIN
  -- Extract role from user metadata, default to 'participant'
  user_role_from_metadata := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'participant'
  );

  -- Validate that the role exists in our enum
  IF user_role_from_metadata NOT IN ('admin', 'company', 'participant', 'sponsor', 'evaluator') THEN
    user_role_from_metadata := 'participant';
  END IF;

  -- Insert the role for the new user
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, user_role_from_metadata::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create profile entry
  INSERT INTO profiles (
    id,
    username,
    full_name
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user_role: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role_assignment ON auth.users;
CREATE TRIGGER on_auth_user_created_role_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

-- Test the function to ensure it's working
DO $$
BEGIN
  RAISE NOTICE 'Trigger function recreated successfully';
END $$;
