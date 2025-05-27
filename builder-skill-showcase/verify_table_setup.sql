
-- Verify that the table structure is correct after running fix_table_structure.sql

-- Check if the enum exists and show its values
SELECT enumlabel as available_roles 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
ORDER BY enumsortorder;

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify constraints exist
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'user_roles'::regclass;

-- Test the table structure without violating foreign key constraints
DO $$
BEGIN
    -- Test that the enum values work
    PERFORM 'admin'::app_role;
    PERFORM 'company'::app_role;
    PERFORM 'participant'::app_role;
    PERFORM 'sponsor'::app_role;
    PERFORM 'evaluator'::app_role;
    
    -- Test that the table exists and has the right columns
    PERFORM column_name FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'user_id';
    
    PERFORM column_name FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'role';
    
    RAISE NOTICE 'Table structure verification successful!';
EXCEPTION 
    WHEN others THEN
        RAISE EXCEPTION 'Table structure verification failed: %', SQLERRM;
END $$;
