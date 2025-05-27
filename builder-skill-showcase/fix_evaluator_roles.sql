
-- Script to fix evaluator role assignments and ensure proper permissions

-- First, let's check if evaluator role exists in the enum
DO $$
BEGIN
    -- Add evaluator role if it doesn't exist
    BEGIN
        ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'evaluator';
    EXCEPTION 
        WHEN duplicate_object THEN 
            RAISE NOTICE 'evaluator role already exists in enum';
    END;
END $$;

-- Function to assign evaluator role to users who signed up as evaluators but don't have the role
CREATE OR REPLACE FUNCTION assign_missing_evaluator_roles()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find users who have 'evaluator' in their metadata but no evaluator role
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'evaluator'
        WHERE u.raw_user_meta_data->>'role' = 'evaluator'
        AND ur.user_id IS NULL
    LOOP
        -- Insert the missing evaluator role
        INSERT INTO user_roles (user_id, role)
        VALUES (user_record.id, 'evaluator'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Assigned evaluator role to user: % (ID: %)', user_record.email, user_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to fix any existing issues
SELECT assign_missing_evaluator_roles();

-- Create policies for evaluators if they don't exist
DO $$
BEGIN
    -- Policy for evaluators to view submissions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'submissions' 
        AND policyname = 'Evaluators can view all submissions'
    ) THEN
        CREATE POLICY "Evaluators can view all submissions" ON submissions FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
          )
        );
    END IF;

    -- Policy for evaluators to manage scores
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'scores' 
        AND policyname = 'Evaluators can manage scores'
    ) THEN
        CREATE POLICY "Evaluators can manage scores" ON scores FOR ALL USING (
          evaluator_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
          )
        );
    END IF;
END $$;

-- Verify the setup
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as metadata_role,
    array_agg(ur.role) as assigned_roles
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.raw_user_meta_data->>'role' = 'evaluator'
GROUP BY u.id, u.email, u.raw_user_meta_data;
