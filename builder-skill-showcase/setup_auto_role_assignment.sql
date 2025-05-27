
-- Function to handle user role assignment after signup
CREATE OR REPLACE FUNCTION handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get the role from user metadata, default to 'participant'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'participant'::app_role
  );
  
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

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_role_assignment ON auth.users;

-- Create trigger to automatically assign roles when user is created
CREATE TRIGGER on_auth_user_created_role_assignment
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_role();

-- Add unique constraint to prevent duplicate role assignments
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
