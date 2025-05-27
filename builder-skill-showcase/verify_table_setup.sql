
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

-- Test inserting a role to make sure everything works
DO $$
BEGIN
    -- Try to insert a test role (will be cleaned up)
    INSERT INTO user_roles (user_id, role) 
    VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'participant'::app_role)
    ON CONFLICT DO NOTHING;
    
    -- Clean up the test
    DELETE FROM user_roles WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
    
    RAISE NOTICE 'Table structure verification successful!';
EXCEPTION 
    WHEN others THEN
        RAISE EXCEPTION 'Table structure verification failed: %', SQLERRM;
END $$;
