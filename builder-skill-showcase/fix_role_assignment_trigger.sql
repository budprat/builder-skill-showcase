
-- Fix role assignment trigger for new user signups

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Create improved function to handle new user role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get role from user metadata
    user_role := NEW.raw_user_meta_data->>'role';
    
    -- If no role specified, default to participant
    IF user_role IS NULL OR user_role = '' THEN
        user_role := 'participant';
    END IF;
    
    -- Insert the role (ignore if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log the role assignment
    RAISE LOG 'Assigned role % to user %', user_role, NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the user creation
        RAISE LOG 'Error assigning role to user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign roles on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Ensure we have a unique constraint on user_id and role combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_role_unique 
ON user_roles(user_id, role);
