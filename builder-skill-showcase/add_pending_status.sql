
-- First, let's see the current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'submissions_status_check';

-- Drop the existing constraint
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Add the new constraint with 'pending' included
ALTER TABLE submissions 
ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('submitted', 'pending', 'judging', 'completed'));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'submissions_status_check';
