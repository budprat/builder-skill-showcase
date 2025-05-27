
-- Fix table structure and enum issues

-- Step 1: Check and fix the app_role enum
DO $$
BEGIN
    -- Drop and recreate the enum completely
    DROP TYPE IF EXISTS app_role CASCADE;
    CREATE TYPE app_role AS ENUM ('admin', 'company', 'participant', 'sponsor', 'evaluator');
    RAISE NOTICE 'Created app_role enum with all values';
END $$;

-- Step 2: Drop and recreate user_roles table with correct structure
DROP TABLE IF EXISTS user_roles CASCADE;

CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'participant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add unique constraint
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Step 4: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
CREATE POLICY "Users can read their own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own roles" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL USING (
  auth.uid() = '3dde62f3-5045-4bc8-90b5-676d7ec368cc'::uuid
);

-- Step 6: Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Step 7: Recreate the trigger function
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role_text TEXT;
  user_role app_role;
BEGIN
  -- Get the role from user metadata as text first
  user_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'participant');
  
  -- Convert to enum with validation
  BEGIN
    user_role := user_role_text::app_role;
  EXCEPTION 
    WHEN invalid_text_representation THEN
      -- If the role is invalid, default to participant
      user_role := 'participant'::app_role;
      RAISE WARNING 'Invalid role % provided for user %, defaulting to participant', user_role_text, NEW.id;
  END;
  
  -- Log the role assignment attempt
  RAISE NOTICE 'Assigning role % to user %', user_role, NEW.id;
  
  -- Insert the role with error handling
  BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role % assigned successfully to user %', user_role, NEW.id;
  EXCEPTION 
    WHEN others THEN
      RAISE WARNING 'Failed to assign role % to user %: %', user_role, NEW.id, SQLERRM;
      -- Don't fail the user creation, just log the error
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role_assignment ON auth.users;
CREATE TRIGGER on_auth_user_created_role_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

-- Step 9: Re-add admin user
INSERT INTO user_roles (user_id, role) 
VALUES ('3dde62f3-5045-4bc8-90b5-676d7ec368cc'::uuid, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 10: Verify the structure
\d user_roles;

-- Step 11: Show available enum values
SELECT enumlabel as available_roles 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
ORDER BY enumsortorder;
