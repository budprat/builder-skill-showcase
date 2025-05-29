
-- Remove duplicate scores keeping only the latest one for each submission

WITH RankedScores AS (
  SELECT 
    id,
    submission_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY submission_id 
      ORDER BY created_at DESC
    ) as rn
  FROM scores
)
DELETE FROM scores 
WHERE id IN (
  SELECT id 
  FROM RankedScores 
  WHERE rn > 1
);

-- Verify no duplicates remain
SELECT 
  submission_id,
  COUNT(*) as score_count
FROM scores
GROUP BY submission_id
HAVING COUNT(*) > 1;

-- Show remaining scores
SELECT 
  s.submission_id,
  c.title as challenge_title,
  s.total_score,
  s.created_at
FROM scores s
LEFT JOIN submissions sub ON s.submission_id = sub.id
LEFT JOIN challenges c ON sub.challenge_id = c.id
ORDER BY s.created_at DESC;
