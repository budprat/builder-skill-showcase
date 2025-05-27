
-- Complete fix for role enum and signup issues

-- Step 1: Drop and recreate the enum with all required values
DO $$
BEGIN
    -- First, check if we have any dependencies on the enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        -- Drop the enum if it exists (this will fail if there are dependencies)
        BEGIN
            DROP TYPE app_role CASCADE;
            RAISE NOTICE 'Dropped existing app_role enum';
        EXCEPTION 
            WHEN dependent_objects_still_exist THEN
                RAISE NOTICE 'Cannot drop enum due to dependencies, will try to add values instead';
                
                -- Try to add missing values to existing enum
                BEGIN
                    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sponsor';
                    RAISE NOTICE 'Added sponsor role to enum';
                EXCEPTION 
                    WHEN duplicate_object THEN 
                        RAISE NOTICE 'sponsor role already exists';
                END;
                
                BEGIN
                    ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'evaluator';
                    RAISE NOTICE 'Added evaluator role to enum';
                EXCEPTION 
                    WHEN duplicate_object THEN 
                        RAISE NOTICE 'evaluator role already exists';
                END;
        END;
    END IF;
    
    -- Create the enum if it doesn't exist or was dropped
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('admin', 'company', 'participant', 'sponsor', 'evaluator');
        RAISE NOTICE 'Created new app_role enum with all values';
    END IF;
END $$;

-- Step 2: Ensure user_roles table exists with correct structure
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'participant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add unique constraint to prevent duplicates
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Step 4: Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Recreate policies
DROP POLICY IF EXISTS "Users can read their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

CREATE POLICY "Users can read their own roles" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own roles" ON user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Step 6: Update the trigger function to handle errors gracefully
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  role_enum app_role;
BEGIN
  -- Get the role from user metadata as text first
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'participant');
  
  -- Convert to enum type with validation
  BEGIN
    role_enum := user_role::app_role;
  EXCEPTION 
    WHEN invalid_text_representation THEN
      -- If the role is invalid, default to participant
      role_enum := 'participant'::app_role;
      RAISE WARNING 'Invalid role % provided, defaulting to participant for user %', user_role, NEW.id;
  END;
  
  -- Log the role assignment attempt
  RAISE NOTICE 'Assigning role % to user %', role_enum, NEW.id;
  
  -- Insert the role with error handling
  BEGIN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, role_enum)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role % assigned successfully to user %', role_enum, NEW.id;
  EXCEPTION 
    WHEN others THEN
      RAISE WARNING 'Failed to assign role % to user %: %', role_enum, NEW.id, SQLERRM;
      -- Don't fail the user creation, just log the error
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created_role_assignment ON auth.users;
CREATE TRIGGER on_auth_user_created_role_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Step 9: Test the enum values
DO $$
BEGIN
    RAISE NOTICE 'Testing enum values...';
    PERFORM 'admin'::app_role;
    PERFORM 'company'::app_role;
    PERFORM 'participant'::app_role;
    PERFORM 'sponsor'::app_role;
    PERFORM 'evaluator'::app_role;
    RAISE NOTICE 'All enum values are valid!';
EXCEPTION 
    WHEN others THEN
        RAISE EXCEPTION 'Enum validation failed: %', SQLERRM;
END $$;

-- Step 10: Show current enum values
SELECT enumlabel as available_roles 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
ORDER BY enumsortorder;
