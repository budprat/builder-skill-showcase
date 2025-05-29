
-- Fix foreign key constraint to allow cascading deletes from submissions to scores

-- First, drop the existing foreign key constraint
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_submission_id_fkey;
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_submission_id_key;

-- Add the foreign key constraint back with CASCADE delete
ALTER TABLE scores 
ADD CONSTRAINT scores_submission_id_fkey 
FOREIGN KEY (submission_id) 
REFERENCES submissions(id) 
ON DELETE CASCADE;

-- Verify the constraint is working
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'scores'
  AND kcu.column_name = 'submission_id';
