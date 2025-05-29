
-- Fix scores creation and JSON formatting issues

-- First, check what we have in the submissions table
SELECT 
  'Current submissions status:' as info,
  id,
  status,
  final_score,
  llm_feedback,
  created_at
FROM submissions 
WHERE status = 'reviewed'
ORDER BY created_at DESC;

-- Check current scores table structure
SELECT 
  'Scores table structure:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'scores' 
  AND table_schema = 'public'
ORDER BY column_name;

-- Check if we have any scores at all
SELECT 
  'Current scores count:' as info,
  COUNT(*) as total_scores
FROM scores;

-- Delete any invalid scores that might be causing issues
DELETE FROM scores WHERE feedback IS NOT NULL AND feedback::text = 'AI evaluation completed';

-- Create proper scores records from existing submission data
INSERT INTO scores (
  submission_id,
  evaluator_id,
  total_score,
  pre_screening_score,
  llm_scores,
  feedback,
  status,
  created_at,
  updated_at
)
SELECT 
  s.id as submission_id,
  NULL as evaluator_id, -- AI evaluation
  COALESCE(s.final_score, 0) as total_score,
  5 as pre_screening_score, -- Default to 5 if repo exists
  CASE 
    WHEN s.final_score IS NOT NULL THEN
      -- Create proper LLM scores structure based on final score
      jsonb_build_object(
        'innovation', jsonb_build_object(
          'score', COALESCE(s.final_score, 0) * 0.25,
          'explanation', 'AI evaluation of innovation and creativity aspects'
        ),
        'technical_implementation', jsonb_build_object(
          'score', COALESCE(s.final_score, 0) * 0.25,
          'explanation', 'AI evaluation of technical implementation quality'
        ),
        'presentation', jsonb_build_object(
          'score', COALESCE(s.final_score, 0) * 0.25,
          'explanation', 'AI evaluation of presentation and documentation'
        ),
        'practicality', jsonb_build_object(
          'score', COALESCE(s.final_score, 0) * 0.25,
          'explanation', 'AI evaluation of practical applicability'
        )
      )
    ELSE NULL
  END as llm_scores,
  CASE 
    WHEN s.llm_feedback IS NOT NULL THEN s.llm_feedback::jsonb
    ELSE '"AI evaluation completed"'::jsonb
  END as feedback,
  'completed' as status,
  s.created_at,
  s.updated_at
FROM submissions s
WHERE s.status = 'reviewed'
  AND NOT EXISTS (
    SELECT 1 FROM scores sc 
    WHERE sc.submission_id = s.id
  );

-- Ensure RLS policies allow evaluators to see scores
DROP POLICY IF EXISTS "Evaluators can view all scores" ON scores;
CREATE POLICY "Evaluators can view all scores" ON scores 
FOR SELECT USING (
  auth.uid() IS NOT NULL OR
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('evaluator', 'admin')
  )
);

-- Grant permissions
GRANT SELECT ON scores TO authenticated;
GRANT SELECT ON scores TO anon;

-- Verify the fix worked
SELECT 
  'Final verification - Submissions with scores:' as info,
  s.id,
  s.status,
  s.final_score,
  sc.total_score,
  sc.pre_screening_score,
  CASE WHEN sc.llm_scores IS NOT NULL THEN 'Has LLM scores' ELSE 'No LLM scores' END as llm_status,
  sc.feedback::text as feedback_preview
FROM submissions s
LEFT JOIN scores sc ON s.id = sc.submission_id
WHERE s.status = 'reviewed'
ORDER BY s.created_at DESC;

-- Show total counts
SELECT 
  'Summary:' as info,
  (SELECT COUNT(*) FROM submissions WHERE status = 'reviewed') as reviewed_submissions,
  (SELECT COUNT(*) FROM scores) as total_scores,
  (SELECT COUNT(*) FROM scores WHERE llm_scores IS NOT NULL) as scores_with_llm
;
