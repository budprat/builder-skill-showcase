
-- Fix missing challenges_id_seq sequence

-- First, check if the challenges table exists and what its structure looks like
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'challenges' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if the sequence exists
SELECT sequence_name 
FROM information_schema.sequences 
WHERE sequence_name = 'challenges_id_seq' AND sequence_schema = 'public';

-- Check if the challenges table has an id column and what type it is
DO $$
DECLARE
    id_column_type TEXT;
BEGIN
    -- Get the data type of the id column
    SELECT data_type INTO id_column_type
    FROM information_schema.columns 
    WHERE table_name = 'challenges' 
    AND column_name = 'id' 
    AND table_schema = 'public';
    
    IF id_column_type IS NULL THEN
        -- If the id column doesn't exist, add it as UUID with default
        ALTER TABLE challenges ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
        RAISE NOTICE 'Added UUID id column to challenges table';
    ELSIF id_column_type = 'uuid' THEN
        -- If id column exists and is UUID, ensure it has proper default
        ALTER TABLE challenges ALTER COLUMN id SET DEFAULT gen_random_uuid();
        RAISE NOTICE 'Set UUID default for challenges id column';
    ELSE
        RAISE NOTICE 'Challenges id column exists with type: %, no changes needed', id_column_type;
    END IF;
END $$;

-- Grant necessary permissions for UUID generation
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO authenticated;
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO anon;

-- Verify the fix
SELECT 
    'Challenges table configured successfully' as status,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'challenges' AND column_name = 'id' AND table_schema = 'public';

-- Test that UUID generation works
SELECT gen_random_uuid() as test_uuid_generation;
