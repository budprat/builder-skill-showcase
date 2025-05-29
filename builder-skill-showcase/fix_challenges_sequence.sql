
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

-- Create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS challenges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Check if the challenges table has an id column
DO $$
BEGIN
    -- If the id column doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'challenges' 
        AND column_name = 'id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE challenges ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to challenges table';
    ELSE
        -- If id column exists but doesn't use the sequence, fix it
        ALTER TABLE challenges ALTER COLUMN id SET DEFAULT nextval('challenges_id_seq');
        
        -- Make sure the sequence is owned by the id column
        ALTER SEQUENCE challenges_id_seq OWNED BY challenges.id;
        
        -- Set the sequence current value to max existing id + 1
        SELECT setval('challenges_id_seq', COALESCE(MAX(id), 0) + 1, false) FROM challenges;
        
        RAISE NOTICE 'Fixed id column to use challenges_id_seq';
    END IF;
END $$;

-- Grant necessary permissions on the sequence
GRANT USAGE, SELECT ON SEQUENCE challenges_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE challenges_id_seq TO anon;

-- Verify the fix
SELECT 
    'Sequence created successfully' as status,
    sequence_name,
    start_value,
    increment,
    max_value,
    min_value
FROM information_schema.sequences 
WHERE sequence_name = 'challenges_id_seq';

-- Test that the sequence works
SELECT nextval('challenges_id_seq') as test_next_value;
SELECT currval('challenges_id_seq') as test_current_value;

-- Reset the sequence to not interfere with actual data
SELECT setval('challenges_id_seq', COALESCE((SELECT MAX(id) FROM challenges), 0), true);
