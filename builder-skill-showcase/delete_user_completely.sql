
-- Script to completely delete a user from the system
-- Replace 'user_email@example.com' with the actual email of the user you want to delete

DO $$
DECLARE
    target_email TEXT := 'user_email@example.com'; -- Change this to the user's email
    target_user_id UUID;
BEGIN
    -- Get the user ID from the email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_email;
    
    IF target_user_id IS NOT NULL THEN
        -- Delete from user_roles table
        DELETE FROM user_roles WHERE user_id = target_user_id;
        
        -- Delete from profiles table
        DELETE FROM profiles WHERE id = target_user_id;
        
        -- Delete from any other related tables (scores, submissions, etc.)
        DELETE FROM scores WHERE evaluator_id = target_user_id OR sponsor_id = target_user_id OR company_id = target_user_id;
        DELETE FROM submissions WHERE participant_id = target_user_id;
        DELETE FROM challenges WHERE company_id = target_user_id;
        
        -- Finally, delete from auth.users (this requires superuser privileges)
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RAISE NOTICE 'User % (ID: %) has been completely deleted', target_email, target_user_id;
    ELSE
        RAISE NOTICE 'User with email % not found', target_email;
    END IF;
END $$;
